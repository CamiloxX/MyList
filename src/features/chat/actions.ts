"use server";

import { z } from "zod";
import { safeActionError } from "@/lib/action-error";
import { createClient } from "@/lib/supabase/server";
import { type ChatSendInput, chatSendSchema } from "./schemas";

export type ChatActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();
const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";
const NOT_ADMIN = "No tienes permisos";
const THROTTLED = "Espera un momento antes de enviar otro mensaje";
const RESTRICTED = "No puedes enviar mensajes: estás silenciado o baneado";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, isAdmin: profile?.is_admin ?? false } as const;
}

export async function sendChatMessage(input: ChatSendInput): Promise<ChatActionResult> {
  const parsed = chatSendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, body: parsed.data.body });

  if (error) {
    // The chat_throttle() trigger raises this when the user posts too fast.
    if (error.message.includes("chat_throttled")) return { ok: false, error: THROTTLED };
    // The insert RLS check blocks muted/banned users (is_chat_restricted).
    if (error.message.includes("row-level security")) return { ok: false, error: RESTRICTED };
    return { ok: false, error: safeActionError("chat.send", error) };
  }

  // No revalidate: connected clients receive the new row via Realtime.
  return { ok: true };
}

export async function deleteChatMessage(messageId: string): Promise<ChatActionResult> {
  const parsedId = idSchema.safeParse(messageId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  // RLS enforces owner-or-admin; this just issues the delete.
  const { error } = await supabase.from("chat_messages").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: safeActionError("chat.delete", error) };

  return { ok: true };
}

async function restrictUser(targetUserId: string, type: "mute" | "ban"): Promise<ChatActionResult> {
  const parsedId = idSchema.safeParse(targetUserId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (!isAdmin) return { ok: false, error: NOT_ADMIN };
  if (parsedId.data === user.id) return { ok: false, error: INVALID_DATA };

  // RLS also enforces admin-only; upsert so re-restricting just updates the type.
  const { error } = await supabase
    .from("chat_restrictions")
    .upsert({ user_id: parsedId.data, type, created_by: user.id }, { onConflict: "user_id" });
  if (error) return { ok: false, error: safeActionError("chat.restrict", error) };

  return { ok: true };
}

export async function muteUser(targetUserId: string): Promise<ChatActionResult> {
  return restrictUser(targetUserId, "mute");
}

export async function banUser(targetUserId: string): Promise<ChatActionResult> {
  return restrictUser(targetUserId, "ban");
}

export async function unrestrictUser(targetUserId: string): Promise<ChatActionResult> {
  const parsedId = idSchema.safeParse(targetUserId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (!isAdmin) return { ok: false, error: NOT_ADMIN };

  const { error } = await supabase.from("chat_restrictions").delete().eq("user_id", parsedId.data);
  if (error) return { ok: false, error: safeActionError("chat.unrestrict", error) };

  return { ok: true };
}
