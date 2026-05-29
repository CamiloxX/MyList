"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { evaluateAndPersist } from "@/features/badges/evaluator";
import type { BadgeDefinition } from "@/features/badges/types";
import { getJikanAiringStatus } from "@/lib/jikan/airing";
import { createClient } from "@/lib/supabase/server";
import { getTmdbTvAiringStatus } from "@/lib/tmdb/tv";
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
 * Whether a TV/anime title is currently airing (or returning with more
 * episodes coming). Movies and any lookup failure resolve to false.
 */
async function isCurrentlyAiring(source: string, kind: string, sourceId: string): Promise<boolean> {
  if (kind === "tv" && source === "tmdb") {
    return (await getTmdbTvAiringStatus(sourceId)) === "airing";
  }
  if (kind === "anime" && source === "anilist") {
    return (await getJikanAiringStatus(sourceId)) === "airing";
  }
  return false;
}

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

  // Auto-enable new-episode notifications when adding a still-airing series or
  // anime, so the user starts getting alerts without an extra step.
  const notifyEpisodes = await isCurrentlyAiring(
    parsed.data.source,
    parsed.data.kind,
    parsed.data.sourceId,
  );

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
      notify_episodes: notifyEpisodes,
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

  // Stop pestering about a show the user finished or abandoned. Other statuses
  // leave the flag untouched (add-time detection / the manual toggle own it).
  const patch: { status: MediaStatus; notify_episodes?: boolean } = { status: parsedStatus.data };
  if (parsedStatus.data === "watched" || parsedStatus.data === "dropped") {
    patch.notify_episodes = false;
  }

  const { data: updatedItem, error } = await supabase
    .from("media_items")
    .update(patch)
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
 * Toggles per-title new-episode notifications. The new-episode cron only checks
 * items with this flag on, so this is the single switch the user controls from
 * the detail page.
 */
export async function setNotifyEpisodes(
  id: string,
  enabled: boolean,
): Promise<LibraryActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Inicia sesión primero" };
  }

  const { error } = await supabase
    .from("media_items")
    .update({ notify_episodes: enabled })
    .eq("id", parsedId.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/library/${parsedId.data}`);
  return { ok: true };
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

type MediaItemRow = Database["public"]["Tables"]["media_items"]["Row"];

/**
 * Picks a random pending media item from the current user's library.
 * Used by the "¿Qué veo hoy?" / "What should I watch?" feature on /library.
 *
 * Pool size is small in practice (user's pending list), so we fetch all
 * candidate rows and pick one client-side rather than relying on a
 * Postgres function. Pass `excludeId` to avoid re-suggesting the same
 * title when the user re-rolls.
 */
export async function pickRandomPendingMediaItem(
  excludeId?: string,
): Promise<{ ok: true; item: MediaItemRow | null } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  let query = supabase
    .from("media_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (excludeId) {
    const parsedExclude = idSchema.safeParse(excludeId);
    if (parsedExclude.success) {
      query = query.neq("id", parsedExclude.data);
    }
  }

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: true, item: null };

  const picked = data[Math.floor(Math.random() * data.length)] ?? null;
  return { ok: true, item: picked };
}

type JikanStreamingEntry = { name?: string; url?: string };

/** Anime providers we prefer when Jikan lists several (in priority order). */
const PREFERRED_ANIME_PROVIDERS = ["crunchyroll", "netflix", "amazon prime video", "disney plus"];

/**
 * Maps a streaming-provider name to a deep search URL on that platform's own
 * site, or null when we have no reliable URL pattern for it. Returning null
 * lets the caller fall back to a "where to watch" listing instead of guessing
 * a URL that would land nowhere useful.
 *
 * Substring matching is intentional: TMDB/Jikan report names like "Amazon
 * Prime Video" or "Disney Plus", and Star+ merged into Disney+ in Latin
 * America so both resolve to Disney+.
 */
function platformSearchUrl(providerName: string, title: string): string | null {
  const name = providerName.toLowerCase();
  const q = encodeURIComponent(title);
  if (name.includes("netflix")) return `https://www.netflix.com/search?q=${q}`;
  if (name.includes("prime") || name.includes("amazon"))
    return `https://www.primevideo.com/search?phrase=${q}`;
  if (name.includes("disney") || name.includes("star"))
    return `https://www.disneyplus.com/search?q=${q}`;
  if (name.includes("max") || name.includes("hbo")) return `https://play.max.com/search?q=${q}`;
  if (name.includes("apple")) return `https://tv.apple.com/search?term=${q}`;
  if (name.includes("crunchyroll")) return `https://www.crunchyroll.com/search?q=${q}`;
  if (name.includes("paramount")) return `https://www.paramountplus.com/search/?query=${q}`;
  return null;
}

/**
 * Resolves the best "watch now" URL for a media item, preferring a direct deep
 * link into the streaming platform. When no platform can be addressed directly
 * we fall back to TMDB's where-to-watch page (accurate, lists every provider)
 * and finally to a JustWatch search — never a plain Google search.
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

  // JustWatch search for Colombia — the last-resort destination that still
  // lists where the title is available, instead of a generic web search.
  const justWatchFallback = `https://www.justwatch.com/co/buscar?q=${encodeURIComponent(item.title)}`;

  if (item.source === "tmdb") {
    try {
      const { getWatchProvidersForTitle } = await import("@/lib/tmdb/discover");
      const providers = await getWatchProvidersForTitle(
        Number.parseInt(item.source_id, 10),
        item.kind as "movie" | "tv",
        "CO",
      );

      if (providers) {
        // Providers come sorted by TMDB display priority. Return the first one
        // we can deep-link into directly rather than only checking flatrate[0].
        for (const p of providers.flatrate) {
          const url = platformSearchUrl(p.provider_name, item.title);
          if (url) return url;
        }
        // No deep-linkable provider, but TMDB's page lists them all with
        // working JustWatch redirects — better than guessing.
        if (providers.link) return providers.link;
      }
    } catch (e) {
      console.warn("[getMediaWatchUrl] Failed to fetch TMDB watch providers:", e);
    }
    return justWatchFallback;
  }

  if (item.source === "anilist") {
    try {
      // Jikan returns real per-provider URLs, so we can link straight to them.
      const res = await fetch(`https://api.jikan.moe/v4/anime/${item.source_id}/streaming`);
      if (res.ok) {
        const json = (await res.json()) as { data?: JikanStreamingEntry[] };
        const entries = json.data ?? [];
        if (entries.length > 0) {
          const preferred = entries.find((p) =>
            PREFERRED_ANIME_PROVIDERS.includes((p.name ?? "").toLowerCase()),
          );
          const chosen = preferred ?? entries[0];
          if (chosen?.url) return chosen.url;
        }
      }
    } catch (e) {
      console.warn("[getMediaWatchUrl] Failed to fetch Jikan streaming info:", e);
    }
    return justWatchFallback;
  }

  return justWatchFallback;
}
