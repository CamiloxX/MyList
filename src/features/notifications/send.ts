import "server-only";

import webpush, { type PushSubscription, WebPushError } from "web-push";
import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import type { PushPayload } from "./types";

let configured = false;

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
 * Sends a push notification to every subscription belonging to `userId`.
 * Soft-fails: any send error is swallowed so callers (badge evaluator, cron
 * jobs) never have their main flow blocked by push delivery problems.
 *
 * 404/410 from the push service means the subscription is dead (user
 * uninstalled the app, cleared site data, etc.) — we drop those rows so we
 * don't keep retrying them.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const supabase = await createClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (row) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, body);
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          stale.push(row.id);
        } else {
          console.warn("[push] send failed", err);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }
}
