"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  type CategoryCreateInput,
  categoryCreateSchema,
  type PostCreateInput,
  postCreateSchema,
  type PostEditInput,
  postEditSchema,
  type ThreadCreateInput,
  threadCreateSchema,
} from "./schemas";

export type ForumActionResult = { ok: true } | { ok: false; error: string };
export type ForumActionResultWith<T> = { ok: true; data: T } | { ok: false; error: string };

const idSchema = z.string().uuid();
const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";
const NOT_AUTHORIZED = "No tienes permisos para hacer eso";

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function isCurrentUserAdmin(): Promise<boolean> {
  const { supabase, user } = await getAuthedUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return data?.is_admin ?? false;
}

export async function createThread(
  input: ThreadCreateInput,
): Promise<ForumActionResultWith<{ threadId: string }>> {
  const parsed = threadCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .insert({
      category_id: parsed.data.categoryId,
      user_id: user.id,
      title: parsed.data.title,
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    return { ok: false, error: threadError?.message ?? "No pudimos crear el hilo" };
  }

  const { error: postError } = await supabase.from("forum_posts").insert({
    thread_id: thread.id,
    user_id: user.id,
    body_md: parsed.data.body,
  });

  if (postError) {
    // Clean up the orphan thread so the user can retry without dupes.
    await supabase.from("forum_threads").delete().eq("id", thread.id);
    return { ok: false, error: postError.message };
  }

  revalidatePath(`/forum/thread/${thread.id}`);
  revalidatePath(`/forum/${parsed.data.categoryId}`);
  revalidatePath("/forum");
  return { ok: true, data: { threadId: thread.id } };
}

export async function createPost(
  input: PostCreateInput,
): Promise<ForumActionResultWith<{ postId: string }>> {
  const parsed = postCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: post, error } = await supabase
    .from("forum_posts")
    .insert({
      thread_id: parsed.data.threadId,
      user_id: user.id,
      body_md: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { ok: false, error: error?.message ?? "No pudimos publicar" };
  }

  revalidatePath(`/forum/thread/${parsed.data.threadId}`);
  return { ok: true, data: { postId: post.id } };
}

export async function editPost(input: PostEditInput): Promise<ForumActionResult> {
  const parsed = postEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: post, error } = await supabase
    .from("forum_posts")
    .update({ body_md: parsed.data.body, edited_at: new Date().toISOString() })
    .eq("id", parsed.data.postId)
    .select("thread_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!post) return { ok: false, error: NOT_AUTHORIZED };

  revalidatePath(`/forum/thread/${post.thread_id}`);
  return { ok: true };
}

export async function deletePost(postId: string): Promise<ForumActionResult> {
  const parsedId = idSchema.safeParse(postId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: existing } = await supabase
    .from("forum_posts")
    .select("thread_id")
    .eq("id", parsedId.data)
    .maybeSingle();

  const { error } = await supabase.from("forum_posts").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: error.message };

  if (existing) revalidatePath(`/forum/thread/${existing.thread_id}`);
  return { ok: true };
}

export async function deleteThread(threadId: string): Promise<ForumActionResult> {
  const parsedId = idSchema.safeParse(threadId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: existing } = await supabase
    .from("forum_threads")
    .select("category_id")
    .eq("id", parsedId.data)
    .maybeSingle();

  const { error } = await supabase.from("forum_threads").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: error.message };

  if (existing) revalidatePath(`/forum/${existing.category_id}`);
  revalidatePath("/forum");
  return { ok: true };
}

const pinSchema = z.object({ threadId: z.string().uuid(), pinned: z.boolean() });
export async function pinThread(input: z.input<typeof pinSchema>): Promise<ForumActionResult> {
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_AUTHORIZED };

  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("forum_threads")
    .update({ pinned: parsed.data.pinned })
    .eq("id", parsed.data.threadId)
    .select("category_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (existing) revalidatePath(`/forum/${existing.category_id}`);
  revalidatePath(`/forum/thread/${parsed.data.threadId}`);
  return { ok: true };
}

const lockSchema = z.object({ threadId: z.string().uuid(), locked: z.boolean() });
export async function lockThread(input: z.input<typeof lockSchema>): Promise<ForumActionResult> {
  const parsed = lockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_AUTHORIZED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_threads")
    .update({ locked: parsed.data.locked })
    .eq("id", parsed.data.threadId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/forum/thread/${parsed.data.threadId}`);
  return { ok: true };
}

/**
 * Toggle a like on a post. Inserts when missing, deletes when present.
 */
export async function toggleLike(
  postId: string,
): Promise<ForumActionResultWith<{ liked: boolean }>> {
  const parsedId = idSchema.safeParse(postId);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const { supabase, user } = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: existing } = await supabase
    .from("forum_reactions")
    .select("post_id")
    .eq("post_id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    const { error } = await supabase
      .from("forum_reactions")
      .delete()
      .eq("post_id", parsedId.data)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    liked = false;
  } else {
    const { error } = await supabase
      .from("forum_reactions")
      .insert({ post_id: parsedId.data, user_id: user.id });
    if (error) return { ok: false, error: error.message };
    liked = true;
  }

  const { data: post } = await supabase
    .from("forum_posts")
    .select("thread_id")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (post) revalidatePath(`/forum/thread/${post.thread_id}`);
  return { ok: true, data: { liked } };
}

export async function createCategory(input: CategoryCreateInput): Promise<ForumActionResult> {
  const parsed = categoryCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_DATA };

  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_AUTHORIZED };

  const supabase = await createClient();
  const { error } = await supabase.from("forum_categories").insert({
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    display_order: parsed.data.displayOrder ?? 0,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/forum");
  return { ok: true };
}
