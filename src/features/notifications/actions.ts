"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll, sendPushToUser } from "./send";
import type { SubscribeResult } from "./types";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(500).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/**
 * Stores (or refreshes) the current user's push subscription. The endpoint is
 * unique globally, so the upsert overwrites any prior row for the same device
 * — handy when the browser rotates the subscription after a push service
 * outage. We don't trust the user_agent string from the client for anything
 * security-relevant; it's only stored to help the user identify devices later.
 */
export async function subscribeToPush(input: SubscribeInput): Promise<SubscribeResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      user_agent: parsed.data.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

/**
 * Removes the row matching this endpoint. Scoped by user_id so even if a
 * client lies about the endpoint, RLS still prevents touching someone else's
 * row — but we double-filter for clarity.
 */
export async function unsubscribeFromPush(endpoint: string): Promise<SubscribeResult> {
  const parsed = unsubscribeSchema.safeParse({ endpoint });
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

const testSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
});

/**
 * Sends a one-off test notification to every device of the current user.
 * Title/body come from the client so they're already localised — keeps this
 * action free of any UI strings.
 */
export async function sendTestPush(input: {
  title: string;
  body: string;
}): Promise<SubscribeResult> {
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payload" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  await sendPushToUser(user.id, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: "/library",
    tag: "test",
  });
  return { ok: true };
}

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  url: z.string().max(500).optional(),
});

export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type BroadcastResult =
  | { ok: true; sent: number; failed: number; pruned: number }
  | { ok: false; error: string };

/**
 * Sends a push to every device of every user. Admin-only: we re-check
 * profiles.is_admin server-side because client-side guards are advisory only.
 */
export async function broadcastPushToAll(input: BroadcastInput): Promise<BroadcastResult> {
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, error: "No autorizado" };

  const { sent, failed, pruned } = await sendPushToAll({
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url || "/library",
    tag: "broadcast",
  });
  return { ok: true, sent, failed, pruned };
}
