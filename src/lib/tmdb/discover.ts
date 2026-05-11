import "server-only";

import { tmdbFetch } from "./client";
import {
  type TmdbGenre,
  type TmdbMovie,
  type TmdbSearchResult,
  type TmdbTv,
  tmdbDiscoverMovieResponseSchema,
  tmdbDiscoverTvResponseSchema,
  tmdbGenreListResponseSchema,
  tmdbMultiResponseSchema,
} from "./schemas";

export type DiscoverSort =
  | "popularity.desc"
  | "popularity.asc"
  | "vote_average.desc"
  | "vote_average.asc"
  | "primary_release_date.desc"
  | "first_air_date.desc";

export type DiscoverFilters = {
  withGenres?: number[];
  year?: number;
  minVote?: number;
  sortBy?: DiscoverSort;
  page?: number;
};

const DEFAULT_DISCOVER_REVALIDATE = 60 * 60 * 6; // 6h: trending and discover lists move slowly.

function joinGenres(ids: number[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  return ids.join(",");
}

/** TMDB filters out adult content unless we explicitly opt in. */
const ADULT_FILTER = { include_adult: "false" } as const;

/**
 * Discover movies by genre / year / rating / sort. Used for the "by genre"
 * and "for you" tabs in the Discover feature.
 */
export async function discoverMovies(filters: DiscoverFilters = {}): Promise<TmdbMovie[]> {
  const raw = await tmdbFetch<unknown>("/discover/movie", {
    query: {
      ...ADULT_FILTER,
      with_genres: joinGenres(filters.withGenres),
      primary_release_year: filters.year,
      "vote_average.gte": filters.minVote,
      "vote_count.gte": filters.minVote ? 50 : undefined,
      sort_by: filters.sortBy ?? "popularity.desc",
      page: filters.page ?? 1,
    },
    revalidate: DEFAULT_DISCOVER_REVALIDATE,
  });

  const parsed = tmdbDiscoverMovieResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB /discover/movie unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.map((row) => ({ ...row, media_type: "movie" as const }));
}

export async function discoverTv(filters: DiscoverFilters = {}): Promise<TmdbTv[]> {
  const raw = await tmdbFetch<unknown>("/discover/tv", {
    query: {
      ...ADULT_FILTER,
      with_genres: joinGenres(filters.withGenres),
      first_air_date_year: filters.year,
      "vote_average.gte": filters.minVote,
      "vote_count.gte": filters.minVote ? 50 : undefined,
      sort_by: filters.sortBy ?? "popularity.desc",
      page: filters.page ?? 1,
    },
    revalidate: DEFAULT_DISCOVER_REVALIDATE,
  });

  const parsed = tmdbDiscoverTvResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB /discover/tv unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.map((row) => ({ ...row, media_type: "tv" as const }));
}

export type TrendingWindow = "day" | "week";

/**
 * Trending titles (last day or week). TMDB returns mixed media types, but we
 * pin the kind so the caller gets a homogeneous list it can render with the
 * existing MediaCard.
 */
export async function getTrending(
  mediaType: "movie" | "tv",
  window: TrendingWindow = "week",
): Promise<TmdbSearchResult[]> {
  const raw = await tmdbFetch<unknown>(`/trending/${mediaType}/${window}`, {
    revalidate: 60 * 60 * 3, // 3h
  });
  const parsed = tmdbMultiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB /trending unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.filter(
    (item): item is TmdbSearchResult => item.media_type === "movie" || item.media_type === "tv",
  );
}

export async function getMovieRecommendations(movieId: number): Promise<TmdbMovie[]> {
  const raw = await tmdbFetch<unknown>(`/movie/${movieId}/recommendations`, {
    revalidate: DEFAULT_DISCOVER_REVALIDATE,
  });
  const parsed = tmdbDiscoverMovieResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB recommendations unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.map((row) => ({ ...row, media_type: "movie" as const }));
}

export async function getTvRecommendations(tvId: number): Promise<TmdbTv[]> {
  const raw = await tmdbFetch<unknown>(`/tv/${tvId}/recommendations`, {
    revalidate: DEFAULT_DISCOVER_REVALIDATE,
  });
  const parsed = tmdbDiscoverTvResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB recommendations unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.map((row) => ({ ...row, media_type: "tv" as const }));
}

/** Catalog of TMDB movie/tv genres. Cached for a day; the list barely changes. */
async function getGenres(kind: "movie" | "tv"): Promise<TmdbGenre[]> {
  const raw = await tmdbFetch<unknown>(`/genre/${kind}/list`, {
    revalidate: 60 * 60 * 24,
  });
  const parsed = tmdbGenreListResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB /genre/${kind}/list unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.genres;
}

export const getMovieGenres = () => getGenres("movie");
export const getTvGenres = () => getGenres("tv");
