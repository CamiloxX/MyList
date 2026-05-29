"use server";

import { jikanPoster, jikanTitle, searchJikan } from "@/lib/jikan/search";
import { tmdbImage } from "@/lib/tmdb/client";
import { searchTmdb, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";

export type SearchSuggestion = {
  key: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  kind: "movie" | "tv" | "anime";
};

const MAX_SUGGESTIONS = 6;

/**
 * Lightweight typeahead for the header search bar: returns the top few matches
 * (title + poster + year) for a query, normalized across TMDB and Jikan.
 * Returns an empty list for short queries or on any provider failure so the
 * dropdown just stays closed.
 */
export async function searchSuggestions(
  query: string,
  type: "tmdb" | "anime",
): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    if (type === "anime") {
      const results = await searchJikan(q);
      return results.slice(0, MAX_SUGGESTIONS).map((item) => ({
        key: `anime-${item.mal_id}`,
        title: jikanTitle(item),
        year: item.year ?? null,
        posterUrl: jikanPoster(item),
        kind: "anime" as const,
      }));
    }

    const results = await searchTmdb(q);
    return results.slice(0, MAX_SUGGESTIONS).map((item) => ({
      key: `tmdb-${item.media_type}-${item.id}`,
      title: tmdbTitle(item),
      year: tmdbYear(item),
      posterUrl: tmdbImage(item.poster_path, "w92"),
      kind: item.media_type,
    }));
  } catch {
    return [];
  }
}
