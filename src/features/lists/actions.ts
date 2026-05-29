"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { type ListFormInput, listFormSchema } from "./schemas";

export type ListActionResult = { ok: true } | { ok: false; error: string };
export type ListActionResultWith<T> = { ok: true; data: T } | { ok: false; error: string };

const idSchema = z.string().uuid();
const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";

/** Creates a list for the current user and returns its id. */
export async function createList(
  input: ListFormInput,
): Promise<ListActionResultWith<{ id: string }>> {
  const parsed = listFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID_DATA };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? INVALID_DATA };

  revalidatePath("/lists");
  return { ok: true, data: { id: data.id } };
}

/** Renames / re-describes a list (RLS guarantees ownership). */
export async function updateList(id: string, input: ListFormInput): Promise<ListActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = listFormSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return {
      ok: false,
      error: parsed.success ? INVALID_DATA : (parsed.error.issues[0]?.message ?? INVALID_DATA),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("lists")
    .update({ name: parsed.data.name, description: parsed.data.description ?? null })
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${parsedId.data}`);
  return { ok: true };
}

export async function deleteList(id: string): Promise<ListActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase.from("lists").delete().eq("id", parsedId.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  return { ok: true };
}

/** Adds a title to a list (idempotent), appended at the end. */
export async function addItemToList(
  listId: string,
  mediaItemId: string,
): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success || !idSchema.safeParse(mediaItemId).success) {
    return { ok: false, error: INVALID_DATA };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { count } = await supabase
    .from("list_items")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  const { error } = await supabase
    .from("list_items")
    .upsert(
      { list_id: listId, media_item_id: mediaItemId, position: count ?? 0 },
      { onConflict: "list_id,media_item_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  revalidatePath(`/library/${mediaItemId}`);
  return { ok: true };
}

export async function removeItemFromList(
  listId: string,
  mediaItemId: string,
): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success || !idSchema.safeParse(mediaItemId).success) {
    return { ok: false, error: INVALID_DATA };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("media_item_id", mediaItemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  revalidatePath(`/library/${mediaItemId}`);
  return { ok: true };
}
