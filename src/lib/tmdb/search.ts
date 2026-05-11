import "server-only";

import { tmdbFetch } from "./client";
import { type TmdbSearchResult, tmdbMultiResponseSchema } from "./schemas";

export type { TmdbSearchResult } from "./schemas";

/**
 * Search TMDB for movies and TV shows by free-text query.
 * Filters out person results.
 */
export async function searchTmdb(query: string, page = 1): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];

  const raw = await tmdbFetch<unknown>("/search/multi", {
    query: { query, page, include_adult: "false" },
    // Search results aren't worth caching; user-typed queries are unique.
    revalidate: 0,
  });

  const parsed = tmdbMultiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB returned an unexpected payload: ${parsed.error.message}`);
  }

  return parsed.data.results.filter(
    (item): item is TmdbSearchResult => item.media_type === "movie" || item.media_type === "tv",
  );
}

/** Helper: pick the year from a release_date or first_air_date string. */
export function tmdbYear(item: TmdbSearchResult): number | null {
  const date = item.media_type === "movie" ? item.release_date : item.first_air_date;
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** Helper: title varies by media kind. */
export function tmdbTitle(item: TmdbSearchResult): string {
  return item.media_type === "movie" ? item.title : item.name;
}

/** Helper: original title varies by media kind. */
export function tmdbOriginalTitle(item: TmdbSearchResult): string | undefined {
  return item.media_type === "movie" ? item.original_title : item.original_name;
}
