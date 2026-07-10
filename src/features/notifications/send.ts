import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import webpush, { type PushSubscription, WebPushError } from "web-push";
import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PushPayload } from "./types";

let configured = false;

type Client = SupabaseClient<Database>;
type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };
export type DeliveryStats = { sent: number; failed: number; pruned: number };

/**
 * Lazily wires the VAPID details into web-push the first time we try to send.
 * Returns false if any of the three VAPID env vars is missing — callers should
 * treat that as "push isn't set up, do nothing" rather than throwing, so the
 * rest of the app (badges, library writes) keeps working in environments
 * without push configured.
 */
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = serverEnv.VAPID_PRIVATE_KEY;
  const subject = serverEnv.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Core sender: pushes `payload` to every subscription in `subs`, prunes any
 * that the push service reports as dead (404/410), and returns counts. The
 * `client` is whatever fetched the subs — it's reused to delete stale rows so
 * the deletion runs under the same privileges (own-rows via RLS, or all rows
 * via service-role). Shared by all the public senders below.
 */
async function deliver(
  client: Client,
  subs: SubRow[],
  payload: PushPayload,
): Promise<DeliveryStats> {
  const body = JSON.stringify(payload);
  const stale: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (row) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, body);
        sent += 1;
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          stale.push(row.id);
        } else {
          failed += 1;
          console.warn("[push] send failed", err);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await client.from("push_subscriptions").delete().in("id", stale);
  }
  return { sent, failed, pruned: stale.length };
}

/**
 * Sends a push to every subscription belonging to `userId`, using the caller's
 * own (cookie-authenticated) session. Use this for in-request sends where the
 * recipient IS the logged-in user — e.g. the badge-unlock notification. RLS
 * scopes the query to the user's own rows. Soft-fails so it never blocks the
 * caller's main flow. For sending to an arbitrary user from a trusted server
 * context (cron), use {@link sendPushToUserAdmin} instead.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const supabase = await createClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) return;

  await deliver(supabase, subs, payload);
}

/**
 * Like {@link sendPushToUser} but uses the service-role client, so it works
 * from contexts with no user session (cron dispatcher) and can reach any
 * user's subscriptions regardless of RLS. Returns counts for logging.
 */
export async function sendPushToUserAdmin(
  userId: string,
  payload: PushPayload,
): Promise<DeliveryStats> {
  if (!ensureConfigured()) return { sent: 0, failed: 0, pruned: 0 };

  const admin = createServiceRoleClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

  return deliver(admin, subs, payload);
}

/**
 * Fans a single payload out to *every* push subscription in the database.
 * Caller MUST have already verified the requester is allowed to broadcast —
 * this function is intentionally unauthenticated because it runs from cron
 * jobs and admin actions alike.
 *
 * Uses the service-role client so it can see rows owned by other users
 * (RLS would otherwise hide them). Stale endpoints get pruned as we go.
 * Returns counts so the caller can render "sent to N devices, M dead".
 */
export async function sendPushToAll(payload: PushPayload): Promise<DeliveryStats> {
  if (!ensureConfigured()) return { sent: 0, failed: 0, pruned: 0 };

  const admin = createServiceRoleClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error || !subs || subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

  return deliver(admin, subs, payload);
}
