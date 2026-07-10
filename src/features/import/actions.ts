"use server";

import { revalidatePath } from "next/cache";
import { evaluateAndPersist } from "@/features/badges/evaluator";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import {
  type ImportEntry,
  type ImportItem,
  type ImportSummary,
  importOptionsSchema,
  importPayloadSchema,
} from "./schemas";

export type ImportLibraryResult =
  | { ok: true; data: ImportSummary }
  | { ok: false; error: "notSignedIn" | "invalidPayload" | "importFailed" };

const BATCH_SIZE = 500;

type ExistingItem = {
  id: string;
  source: "tmdb" | "anilist";
  source_id: string;
  kind: "movie" | "tv" | "anime";
  status: "watching" | "watched" | "pending" | "dropped";
  updated_at: string;
  title: string;
  original_title: string | null;
  year: number | null;
  runtime_minutes: number | null;
  episode_count: number | null;
  episodes_watched: number | null;
  poster_url: string | null;
  genres: Json;
};

/** Logical identity of a title — mirrors the unique(user_id, source, source_id, kind) index. */
function itemKey(item: Pick<ExistingItem, "source" | "source_id" | "kind">): string {
  return `${item.source}|${item.source_id}|${item.kind}`;
}

/**
 * Content identity of a watch entry. Idempotency is content-based instead of
 * preserving exported uuids: a file exported from account A can be imported
 * into account B without primary-key collisions, and re-importing the same
 * file always yields zero duplicates.
 */
function entryKey(
  mediaKey: string,
  entry: Pick<ImportEntry, "watched_on" | "rating" | "platform" | "season_number" | "notes">,
): string {
  return [
    mediaKey,
    entry.watched_on,
    entry.season_number ?? "",
    entry.rating ?? "",
    entry.platform ?? "",
    entry.notes ?? "",
  ].join("|");
}

function isPayloadNewer(payloadUpdatedAt: string | undefined, existingUpdatedAt: string): boolean {
  if (!payloadUpdatedAt) return false;
  const a = Date.parse(payloadUpdatedAt);
  const b = Date.parse(existingUpdatedAt);
  return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
}

/**
 * Imports a canonical MyList JSON export into the current user's library.
 *
 * Retry-safe rather than atomic: items are upserted on the logical unique key
 * with ignoreDuplicates and entries are deduped by content, so re-running a
 * half-failed import completes the missing part without duplicating anything.
 * `dryRun: true` computes the exact summary without writing.
 */
export async function importLibrary(
  rawPayload: unknown,
  rawOptions: unknown,
): Promise<ImportLibraryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "notSignedIn" };

  const options = importOptionsSchema.safeParse(rawOptions);
  const payload = importPayloadSchema.safeParse(rawPayload);
  if (!options.success || !payload.success) {
    return { ok: false, error: "invalidPayload" };
  }
  const { dryRun, policy } = options.data;
  const { items, entries } = payload.data;

  try {
    // ---- Load current library (paginated past PostgREST's ~1000-row cap) ----
    const existingItems = await fetchAllRows<ExistingItem>((from, to) =>
      supabase
        .from("media_items")
        .select(
          "id, source, source_id, kind, status, updated_at, title, original_title, year, runtime_minutes, episode_count, episodes_watched, poster_url, genres",
        )
        .eq("user_id", user.id)
        .order("id")
        .range(from, to),
    );
    const existingByKey = new Map(existingItems.map((item) => [itemKey(item), item]));
    const existingIdToKey = new Map(existingItems.map((item) => [item.id, itemKey(item)]));

    const existingEntries = await fetchAllRows<
      Pick<ImportEntry, "watched_on" | "rating" | "platform" | "season_number" | "notes"> & {
        media_item_id: string;
      }
    >((from, to) =>
      supabase
        .from("watch_entries")
        .select("media_item_id, watched_on, rating, platform, season_number, notes")
        .eq("user_id", user.id)
        .order("id")
        .range(from, to),
    );
    const existingEntryKeys = new Set(
      existingEntries.flatMap((entry) => {
        const key = existingIdToKey.get(entry.media_item_id);
        return key ? [entryKey(key, entry)] : [];
      }),
    );

    // ---- Classify items ----
    const newItems: ImportItem[] = [];
    const mergeItems: { payload: ImportItem; existing: ExistingItem }[] = [];
    let skippedItems = 0;

    for (const item of items) {
      const existing = existingByKey.get(itemKey(item));
      if (!existing) {
        newItems.push(item);
        continue;
      }
      if (policy === "merge" && isPayloadNewer(item.updated_at, existing.updated_at)) {
        mergeItems.push({ payload: item, existing });
      } else {
        skippedItems += 1;
      }
    }

    // ---- Classify entries (drop orphans, dedupe vs DB and within the file) ----
    const payloadIdToKey = new Map(items.map((item) => [item.id, itemKey(item)]));
    const seenInFile = new Set<string>();
    const newEntries: { mediaKey: string; entry: ImportEntry }[] = [];
    let duplicateEntries = 0;
    let warnings = 0;

    for (const entry of entries) {
      const mediaKey = payloadIdToKey.get(entry.media_item_id);
      if (!mediaKey) {
        warnings += 1;
        continue;
      }
      const key = entryKey(mediaKey, entry);
      if (existingEntryKeys.has(key) || seenInFile.has(key)) {
        duplicateEntries += 1;
        continue;
      }
      seenInFile.add(key);
      newEntries.push({ mediaKey, entry });
    }

    const summary: ImportSummary = {
      newItems: newItems.length,
      mergedItems: mergeItems.length,
      skippedItems,
      newEntries: newEntries.length,
      duplicateEntries,
      warnings,
    };

    if (dryRun) return { ok: true, data: summary };

    // ---- Insert new items (batched upsert: retry-safe on the unique key) ----
    for (let offset = 0; offset < newItems.length; offset += BATCH_SIZE) {
      const batch = newItems.slice(offset, offset + BATCH_SIZE).map((item) => ({
        user_id: user.id,
        source: item.source,
        source_id: item.source_id,
        kind: item.kind,
        title: item.title,
        original_title: item.original_title ?? null,
        year: item.year ?? null,
        runtime_minutes: item.runtime_minutes ?? null,
        episode_count: item.episode_count ?? null,
        // Column is NOT NULL with default 0.
        episodes_watched: item.episodes_watched ?? 0,
        poster_url: item.poster_url ?? null,
        genres: (item.genres ?? []) as Json,
        status: item.status,
      }));
      const { error } = await supabase
        .from("media_items")
        .upsert(batch, { onConflict: "user_id,source,source_id,kind", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }

    // ---- Merge updates (few in practice, run in small parallel chunks) ----
    for (let offset = 0; offset < mergeItems.length; offset += 20) {
      const chunk = mergeItems.slice(offset, offset + 20);
      const results = await Promise.all(
        chunk.map(({ payload: item, existing }) => {
          const maxEpisodes = Math.max(item.episodes_watched ?? 0, existing.episodes_watched ?? 0);
          return supabase
            .from("media_items")
            .update({
              status: item.status,
              // Merge never erases: only fill fields the library is missing.
              original_title: existing.original_title ?? item.original_title ?? null,
              year: existing.year ?? item.year ?? null,
              runtime_minutes: existing.runtime_minutes ?? item.runtime_minutes ?? null,
              episode_count: existing.episode_count ?? item.episode_count ?? null,
              poster_url: existing.poster_url ?? item.poster_url ?? null,
              episodes_watched: maxEpisodes,
            })
            .eq("id", existing.id);
        }),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
    }

    // ---- Re-read the key -> id map so entries can point at the final rows ----
    const finalItems = await fetchAllRows<
      Pick<ExistingItem, "id" | "source" | "source_id" | "kind">
    >((from, to) =>
      supabase
        .from("media_items")
        .select("id, source, source_id, kind")
        .eq("user_id", user.id)
        .order("id")
        .range(from, to),
    );
    const finalKeyToId = new Map(finalItems.map((item) => [itemKey(item), item.id]));

    // ---- Insert new entries (batched) ----
    const entryRows = newEntries.flatMap(({ mediaKey, entry }) => {
      const mediaItemId = finalKeyToId.get(mediaKey);
      if (!mediaItemId) return []; // item insert was skipped somehow — count nothing, RLS-safe
      return [
        {
          user_id: user.id,
          media_item_id: mediaItemId,
          watched_on: entry.watched_on,
          rating: entry.rating ?? null,
          platform: entry.platform ?? null,
          season_number: entry.season_number ?? null,
          notes: entry.notes ?? null,
        },
      ];
    });
    for (let offset = 0; offset < entryRows.length; offset += BATCH_SIZE) {
      const { error } = await supabase
        .from("watch_entries")
        .insert(entryRows.slice(offset, offset + BATCH_SIZE));
      if (error) throw new Error(error.message);
    }

    // Badges can unlock from imported history; evaluate once at the end.
    await evaluateAndPersist(supabase, user.id);
    revalidatePath("/library");
    revalidatePath("/stats");
    revalidatePath("/month");
    revalidatePath("/year");

    return { ok: true, data: summary };
  } catch (error) {
    console.warn("[importLibrary] failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "importFailed" };
  }
}
