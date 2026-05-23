"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { evaluateAndPersist } from "@/features/badges/evaluator";
import type { BadgeDefinition } from "@/features/badges/types";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import {
  type AddToLibraryInput,
  addToLibrarySchema,
  type WatchEntryInput,
  watchEntrySchema,
} from "./schemas";

export type LibraryActionResult =
  | { ok: true; newBadges?: BadgeDefinition[] }
  | { ok: false; error: string };
export type LibraryActionResultWith<T> =
  | { ok: true; data: T; newBadges?: BadgeDefinition[] }
  | { ok: false; error: string };

type MediaStatus = Database["public"]["Enums"]["media_status"];

const statusSchema = z.enum(["watching", "watched", "pending", "dropped"]);
const idSchema = z.string().uuid();

/**
 * Adds a TMDB or AniList item to the current user's library.
 * Idempotent via the unique (user_id, source, source_id, kind) constraint:
 * a second call updates metadata in place rather than creating a duplicate.
 */
export async function addToLibrary(input: AddToLibraryInput): Promise<LibraryActionResult> {
  const parsed = addToLibrarySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos al agregar a la biblioteca" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Inicia sesión primero" };
  }

  const { error } = await supabase.from("media_items").upsert(
    {
      user_id: user.id,
      source: parsed.data.source,
      source_id: parsed.data.sourceId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      original_title: parsed.data.originalTitle ?? null,
      poster_url: parsed.data.posterUrl ?? null,
      year: parsed.data.year ?? null,
      runtime_minutes: parsed.data.runtimeMinutes ?? null,
      episode_count: parsed.data.episodeCount ?? null,
      genres: parsed.data.genres as Json,
      raw_metadata: (parsed.data.rawMetadata ?? null) as Json,
      status: "pending",
    },
    { onConflict: "user_id,source,source_id,kind" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  const newBadges = await evaluateAndPersist(supabase, user.id);
  revalidatePath("/library");
  return { ok: true, newBadges };
}

/**
 * Updates the watch status of a library item owned by the current user.
 * RLS ensures only the owner can mutate.
 */
export async function updateLibraryStatus(
  id: string,
  status: MediaStatus,
): Promise<LibraryActionResultWith<Database["public"]["Tables"]["media_items"]["Row"]>> {
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Inicia sesión primero" };
  }

  const { data: updatedItem, error } = await supabase
    .from("media_items")
    .update({ status: parsedStatus.data })
    .eq("id", parsedId.data)
    .select("*")
    .single();

  if (error || !updatedItem) {
    return { ok: false, error: error?.message ?? "Error al actualizar el estado" };
  }

  const newBadges = await evaluateAndPersist(supabase, user.id);
  revalidatePath("/library");
  return { ok: true, data: updatedItem, newBadges };
}

/**
 * Removes a library item (and its watch_entries via FK cascade).
 */
export async function removeFromLibrary(id: string): Promise<LibraryActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("media_items").delete().eq("id", parsedId.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/library");
  return { ok: true };
}

/**
 * Adds a watch_entry (a viewing record) for a media_item owned by the user.
 * If the item is currently "pending", auto-bumps it to "watching" on first entry.
 */
export async function addWatchEntry(
  input: WatchEntryInput,
): Promise<LibraryActionResultWith<{ id: string }>> {
  const parsed = watchEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos al registrar visualización" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Inicia sesión primero" };
  }

  const { data: inserted, error } = await supabase
    .from("watch_entries")
    .insert({
      user_id: user.id,
      media_item_id: parsed.data.mediaItemId,
      watched_on: parsed.data.watchedOn,
      rating: parsed.data.rating ?? null,
      platform: parsed.data.platform ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "No pudimos guardar la visualización" };
  }

  // Bump status: "pending" → "watching" if this is the first entry.
  await supabase
    .from("media_items")
    .update({ status: "watching" })
    .eq("id", parsed.data.mediaItemId)
    .eq("status", "pending");

  const newBadges = await evaluateAndPersist(supabase, user.id);
  revalidatePath(`/library/${parsed.data.mediaItemId}`);
  revalidatePath("/library");
  revalidatePath("/month");
  return { ok: true, data: { id: inserted.id }, newBadges };
}

/**
 * Removes a watch_entry by id.
 */
export async function removeWatchEntry(
  id: string,
  mediaItemId: string,
): Promise<LibraryActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsedMediaId = idSchema.safeParse(mediaItemId);
  if (!parsedId.success || !parsedMediaId.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("watch_entries").delete().eq("id", parsedId.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/library/${parsedMediaId.data}`);
  revalidatePath("/month");
  return { ok: true };
}

const seasonSchema = z.object({
  mediaItemId: z.string().uuid(),
  seasonNumber: z.number().int().min(0).max(1000),
});

/**
 * Marks a season as watched by inserting a watch_entry tagged with
 * `season_number`. Idempotent: if the same (media, season) pair already has
 * an entry it is left alone and we report success — the UI is "is the season
 * checked or not", not "how many times have you watched it".
 *
 * Auto-bumps the parent media_item to "watching" if it was still "pending".
 */
export async function markSeasonWatched(input: {
  mediaItemId: string;
  seasonNumber: number;
}): Promise<LibraryActionResult> {
  const parsed = seasonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  const { data: existing } = await supabase
    .from("watch_entries")
    .select("id")
    .eq("media_item_id", parsed.data.mediaItemId)
    .eq("season_number", parsed.data.seasonNumber)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("watch_entries").insert({
      user_id: user.id,
      media_item_id: parsed.data.mediaItemId,
      watched_on: today,
      season_number: parsed.data.seasonNumber,
    });
    if (error) return { ok: false, error: error.message };

    await supabase
      .from("media_items")
      .update({ status: "watching" })
      .eq("id", parsed.data.mediaItemId)
      .eq("status", "pending");
  }

  const newBadges = await evaluateAndPersist(supabase, user.id);
  revalidatePath(`/library/${parsed.data.mediaItemId}`);
  revalidatePath("/library");
  revalidatePath("/month");
  return { ok: true, newBadges };
}

/**
 * Removes ALL watch_entries for a given (media, season) pair. Used when the
 * user toggles a season off — collapses any duplicate entries created by
 * past mark-then-unmark cycles back to zero so the UI stays in sync.
 */
export async function unmarkSeasonWatched(input: {
  mediaItemId: string;
  seasonNumber: number;
}): Promise<LibraryActionResult> {
  const parsed = seasonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("watch_entries")
    .delete()
    .eq("media_item_id", parsed.data.mediaItemId)
    .eq("season_number", parsed.data.seasonNumber);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/library/${parsed.data.mediaItemId}`);
  revalidatePath("/library");
  revalidatePath("/month");
  return { ok: true };
}

/**
 * Resolves the watch/streaming provider URL for a media item.
 * Falls back to IMDB, AniList or a generic Google Search if no direct flatrate links exist.
 */
export async function getMediaWatchUrl(id: string): Promise<string> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    throw new Error("ID inválido");
  }

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("media_items")
    .select("source, source_id, kind, title")
    .eq("id", parsedId.data)
    .single();

  if (!item) {
    throw new Error("Item no encontrado");
  }

  if (item.source === "tmdb") {
    try {
      const { getWatchProvidersForTitle } = await import("@/lib/tmdb/discover");
      // Default to region "CO" (Colombia)
      const providers = await getWatchProvidersForTitle(
        Number.parseInt(item.source_id, 10),
        item.kind as "movie" | "tv",
        "CO",
      );
      if (providers?.link) {
        return providers.link;
      }
    } catch (e) {
      console.warn("[getMediaWatchUrl] Failed to fetch TMDB watch providers:", e);
    }
    // Fallback: TMDB detail page
    return `https://www.themoviedb.org/${item.kind}/${item.source_id}`;
  }

  if (item.source === "anilist") {
    // Direct link to AniList anime page
    return `https://anilist.co/anime/${item.source_id}`;
  }

  // Definite fallback: Google search
  return `https://www.google.com/search?q=${encodeURIComponent(`dónde ver ${item.title}`)}`;
}
