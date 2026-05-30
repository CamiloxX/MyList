"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_COVER_MIME,
  type AllowedCoverMime,
  type ListFormInput,
  listFormSchema,
  MAX_COVER_BYTES,
} from "./schemas";

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

/**
 * Moves a title one slot up or down within a list by swapping its `position`
 * with the adjacent neighbour. RLS guarantees the list belongs to the user.
 * No-op (still `ok`) when the item is already at the relevant edge.
 */
export async function moveListItem(
  listId: string,
  mediaItemId: string,
  direction: "up" | "down",
): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success || !idSchema.safeParse(mediaItemId).success) {
    return { ok: false, error: INVALID_DATA };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: rows, error: loadError } = await supabase
    .from("list_items")
    .select("media_item_id, position")
    .eq("list_id", listId)
    .order("position", { ascending: true });
  if (loadError) return { ok: false, error: loadError.message };

  const ordered = rows ?? [];
  const index = ordered.findIndex((r) => r.media_item_id === mediaItemId);
  if (index === -1) return { ok: false, error: INVALID_DATA };

  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  const current = ordered[index];
  const neighbour = ordered[neighbourIndex];
  // Already at the top/bottom — nothing to do.
  if (!current || !neighbour) return { ok: true };

  // Swap the two stored positions (gap-safe: we exchange values, not indices).
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase
      .from("list_items")
      .update({ position: neighbour.position })
      .eq("list_id", listId)
      .eq("media_item_id", current.media_item_id),
    supabase
      .from("list_items")
      .update({ position: current.position })
      .eq("list_id", listId)
      .eq("media_item_id", neighbour.media_item_id),
  ]);
  if (e1 || e2) return { ok: false, error: (e1 ?? e2)?.message ?? INVALID_DATA };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  return { ok: true };
}

export const LIST_SORT_CRITERIA = ["title", "year_desc", "year_asc", "kind"] as const;
export type ListSortCriterion = (typeof LIST_SORT_CRITERIA)[number];
const sortCriterionSchema = z.enum(LIST_SORT_CRITERIA);

// Display/group order for the "kind" sort; titles stay alpha within each kind.
const KIND_RANK: Record<string, number> = { movie: 0, tv: 1, anime: 2 };

/**
 * Reorders every title in a list by the given criterion and persists the result
 * by rewriting `position` to 0..n-1. After this the manual up/down arrows still
 * work — the sort is just a bulk reassignment of positions. RLS guarantees the
 * list belongs to the user.
 */
export async function sortListItems(
  listId: string,
  criterion: ListSortCriterion,
): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success) return { ok: false, error: INVALID_DATA };
  const parsedCriterion = sortCriterionSchema.safeParse(criterion);
  if (!parsedCriterion.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: rows, error: loadError } = await supabase
    .from("list_items")
    .select("media_item_id, media_items!inner ( title, year, kind )")
    .eq("list_id", listId);
  if (loadError) return { ok: false, error: loadError.message };

  type Row = {
    media_item_id: string;
    media_items: { title: string; year: number | null; kind: string } | null;
  };
  const items = (rows ?? []) as unknown as Row[];

  const byTitle = (a: Row, b: Row) =>
    (a.media_items?.title ?? "").localeCompare(b.media_items?.title ?? "", undefined, {
      sensitivity: "base",
      numeric: true,
    });
  // Titles without a year sink to the bottom regardless of asc/desc direction.
  const byYear = (dir: 1 | -1) => (a: Row, b: Row) => {
    const ya = a.media_items?.year;
    const yb = b.media_items?.year;
    if (ya == null && yb == null) return byTitle(a, b);
    if (ya == null) return 1;
    if (yb == null) return -1;
    return ya === yb ? byTitle(a, b) : (ya - yb) * dir;
  };

  const sorted = [...items];
  switch (parsedCriterion.data) {
    case "title":
      sorted.sort(byTitle);
      break;
    case "year_desc":
      sorted.sort(byYear(-1));
      break;
    case "year_asc":
      sorted.sort(byYear(1));
      break;
    case "kind":
      sorted.sort((a, b) => {
        const ra = KIND_RANK[a.media_items?.kind ?? ""] ?? 99;
        const rb = KIND_RANK[b.media_items?.kind ?? ""] ?? 99;
        return ra === rb ? byTitle(a, b) : ra - rb;
      });
      break;
  }

  const { error } = await supabase
    .from("list_items")
    .upsert(
      sorted.map((row, position) => ({
        list_id: listId,
        media_item_id: row.media_item_id,
        position,
      })),
      { onConflict: "list_id,media_item_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  return { ok: true };
}

/**
 * Lists for the current user, each flagged with whether it already contains the
 * given title. Used by the card "add to list" control to lazy-load on open
 * (avoids one query per card on the library grid).
 */
export async function loadListMemberships(
  mediaItemId: string,
): Promise<{ id: string; name: string; contains: boolean }[]> {
  if (!idSchema.safeParse(mediaItemId).success) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [listsRes, membersRes] = await Promise.all([
    supabase.from("lists").select("id, name").order("created_at", { ascending: true }),
    supabase.from("list_items").select("list_id").eq("media_item_id", mediaItemId),
  ]);
  const inSet = new Set((membersRes.data ?? []).map((m) => m.list_id));
  return (listsRes.data ?? []).map((l) => ({ id: l.id, name: l.name, contains: inSet.has(l.id) }));
}

/**
 * Toggles link-sharing for a list: `unlisted` (viewable by anyone with the
 * link, not listed anywhere) when on, `private` when off. RLS guarantees only
 * the owner can flip it.
 */
export async function setListShared(id: string, shared: boolean): Promise<ListActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("lists")
    .update({ visibility: shared ? "unlisted" : "private" })
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/lists/${parsedId.data}`);
  return { ok: true };
}

const COVER_EXT: Record<AllowedCoverMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Uploads a cover image for a list to `list-covers/<user_id>/<list_id>.<ext>`
 * and stores its public URL on the list. RLS on the lists update ensures only
 * the owner can set it.
 */
export async function uploadListCover(
  listId: string,
  formData: FormData,
): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success) return { ok: false, error: INVALID_DATA };

  const file = formData.get("file");
  if (!(file instanceof Blob)) return { ok: false, error: INVALID_DATA };
  const mime = file.type;
  if (!ALLOWED_COVER_MIME.includes(mime as AllowedCoverMime)) {
    return { ok: false, error: "Formato no soportado (jpg, png o webp)" };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, error: "La imagen pesa más de 3 MB" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const ext = COVER_EXT[mime as AllowedCoverMime];
  const path = `${user.id}/${listId}.${ext}`;

  // Clear other formats so a jpg→webp switch doesn't leave a stale file behind.
  const others = (Object.values(COVER_EXT) as string[]).filter((e) => e !== ext);
  if (others.length > 0) {
    await supabase.storage
      .from("list-covers")
      .remove(others.map((e) => `${user.id}/${listId}.${e}`));
  }

  const { error: uploadError } = await supabase.storage
    .from("list-covers")
    .upload(path, file, { upsert: true, contentType: mime, cacheControl: "3600" });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from("list-covers").getPublicUrl(path);
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.from("lists").update({ cover_url: url }).eq("id", listId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  return { ok: true };
}

export async function removeListCover(listId: string): Promise<ListActionResult> {
  if (!idSchema.safeParse(listId).success) return { ok: false, error: INVALID_DATA };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  await supabase.storage
    .from("list-covers")
    .remove(Object.values(COVER_EXT).map((e) => `${user.id}/${listId}.${e}`));

  const { error } = await supabase.from("lists").update({ cover_url: null }).eq("id", listId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  return { ok: true };
}
