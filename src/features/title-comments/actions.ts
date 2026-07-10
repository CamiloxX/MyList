"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { safeActionError } from "@/lib/action-error";
import { createClient } from "@/lib/supabase/server";
import {
  type CommentCreateInput,
  type CommentEditInput,
  commentCreateSchema,
  commentEditSchema,
} from "./schemas";

export type CommentActionResult = { ok: true } | { ok: false; error: string };
export type CommentActionResultWith<T> = { ok: true; data: T } | { ok: false; error: string };

const idSchema = z.string().uuid();
const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";
const THROTTLED = "Espera un momento antes de comentar de nuevo";

export async function createComment(
  input: CommentCreateInput,
): Promise<CommentActionResultWith<{ commentId: string }>> {
  const parsed = commentCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: row, error } = await supabase
    .from("title_comments")
    .insert({
      user_id: user.id,
      source: parsed.data.source,
      source_id: parsed.data.sourceId,
      kind: parsed.data.kind,
      body_md: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !row) {
    // The title_comment_throttle() trigger raises this when posting too fast.
    if (error?.message.includes("comment_throttled")) return { ok: false, error: THROTTLED };
    return { ok: false, error: safeActionError("title-comments.create", error) };
  }

  // The detail page is per-user (library/:id), but every user who has the
  // same title in their library shares this comment thread — we don't know
  // all their library IDs from here, so revalidate the path the user is on
  // via the calling context (library/:id) optimistically.
  revalidatePath("/library", "layout");
  return { ok: true, data: { commentId: row.id } };
}

export async function editComment(input: CommentEditInput): Promise<CommentActionResult> {
  const parsed = commentEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("title_comments")
    .update({ body_md: parsed.data.body, edited_at: new Date().toISOString() })
    .eq("id", parsed.data.commentId);

  if (error) return { ok: false, error: safeActionError("title-comments.edit", error) };
  revalidatePath("/library", "layout");
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<CommentActionResult> {
  const parsedId = idSchema.safeParse(commentId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase.from("title_comments").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: safeActionError("title-comments.delete", error) };

  revalidatePath("/library", "layout");
  return { ok: true };
}
