import "server-only";

import { jikanFetch } from "./client";
import {
  type JikanAnime,
  type JikanGenre,
  jikanGenresResponseSchema,
  jikanRecommendationsResponseSchema,
  jikanSearchResponseSchema,
} from "./schemas";

const DEFAULT_REVALIDATE = 60 * 60 * 6; // 6h

export type JikanAnimeType = "tv" | "movie" | "ova" | "ona" | "special" | "music";
export type JikanTopFilter = "airing" | "upcoming" | "bypopularity" | "favorite";

export type DiscoverAnimeFilters = {
  genres?: number[];
  type?: JikanAnimeType;
  year?: number;
  minScore?: number;
  page?: number;
};

function joinGenres(ids: number[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  return ids.join(",");
}

/**
 * Top anime list. Defaults to "by popularity" which is the closest analogue to
 * TMDB's trending endpoint.
 */
export async function getTopAnime(
  options: { filter?: JikanTopFilter; type?: JikanAnimeType; page?: number } = {},
): Promise<JikanAnime[]> {
  const raw = await jikanFetch<unknown>("/top/anime", {
    query: {
      filter: options.filter ?? "bypopularity",
      type: options.type,
      page: options.page,
      limit: 24,
    },
    revalidate: DEFAULT_REVALIDATE,
  });

  const parsed = jikanSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Jikan /top/anime unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.data;
}

/**
 * Discover anime by genre / type / year / score. Mirrors discoverMovies in
 * spirit, but talks to Jikan's `/anime` endpoint with filter params.
 */
export async function discoverAnime(filters: DiscoverAnimeFilters = {}): Promise<JikanAnime[]> {
  const raw = await jikanFetch<unknown>("/anime", {
    query: {
      genres: joinGenres(filters.genres),
      type: filters.type,
      // Jikan accepts start_date as YYYY-MM-DD; we limit to the given year.
      start_date: filters.year ? `${filters.year}-01-01` : undefined,
      end_date: filters.year ? `${filters.year}-12-31` : undefined,
      min_score: filters.minScore,
      order_by: "score",
      sort: "desc",
      page: filters.page ?? 1,
      limit: 24,
    },
    revalidate: DEFAULT_REVALIDATE,
  });

  const parsed = jikanSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Jikan /anime unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.data;
}

export async function getAnimeRecommendations(malId: number): Promise<JikanAnime[]> {
  const raw = await jikanFetch<unknown>(`/anime/${malId}/recommendations`, {
    revalidate: DEFAULT_REVALIDATE,
  });
  const parsed = jikanRecommendationsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Jikan recommendations unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.data.map((row) => row.entry);
}

/** Catalog of anime genres. Cached for a day. */
export async function getAnimeGenres(): Promise<JikanGenre[]> {
  const raw = await jikanFetch<unknown>("/genres/anime", {
    revalidate: 60 * 60 * 24,
  });
  const parsed = jikanGenresResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Jikan /genres/anime unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.data;
}
