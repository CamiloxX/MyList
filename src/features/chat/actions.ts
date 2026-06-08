"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { type ChatSendInput, chatSendSchema } from "./schemas";

export type ChatActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();
const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";
const THROTTLED = "Espera un momento antes de enviar otro mensaje";

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
    return { ok: false, error: error.message };
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
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
