import "server-only";

import { tmdbFetch } from "./client";
import {
  type TmdbGenre,
  type TmdbMovie,
  type TmdbSearchResult,
  type TmdbTv,
  type TmdbWatchProvider,
  tmdbDiscoverMovieResponseSchema,
  tmdbDiscoverTvResponseSchema,
  tmdbExternalIdsSchema,
  tmdbGenreListResponseSchema,
  tmdbMultiResponseSchema,
  tmdbWatchProvidersByRegionResponseSchema,
  tmdbWatchProvidersResponseSchema,
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
  /**
   * Streaming provider id (TMDB internal id, e.g. 8 = Netflix). When set,
   * `region` MUST also be provided — TMDB rejects watch-provider filters
   * without a region.
   */
  withWatchProviders?: number[];
  /** ISO-3166-1 alpha-2 region code (e.g. "CO"). Required when filtering by provider. */
  region?: string;
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
      with_watch_providers: joinGenres(filters.withWatchProviders),
      watch_region: filters.region,
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
      with_watch_providers: joinGenres(filters.withWatchProviders),
      watch_region: filters.region,
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

/**
 * Streaming providers available in `region` for the given media kind. Used to
 * populate the Discover provider filter dropdown. The region matters because
 * TMDB returns a different roster per country (e.g. Vix exists in MX, not US).
 */
export async function getWatchProviders(
  kind: "movie" | "tv",
  region: string,
): Promise<TmdbWatchProvider[]> {
  const raw = await tmdbFetch<unknown>(`/watch/providers/${kind}`, {
    query: { watch_region: region },
    revalidate: 60 * 60 * 24, // 1 day
  });
  const parsed = tmdbWatchProvidersResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`TMDB /watch/providers/${kind} unexpected payload: ${parsed.error.message}`);
  }
  return parsed.data.results.sort(
    (a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999),
  );
}

export type WatchProvidersForTitle = {
  /** TMDB-hosted "where to watch" deep link for the chosen region. */
  link: string | null;
  /** Subscription providers in this region (Netflix, Disney+, etc.). */
  flatrate: TmdbWatchProvider[];
};

/**
 * Streaming providers where a specific title can be watched in `region`.
 * Returns `null` when there is no flatrate availability listed (TMDB has
 * limited coverage for older or regional-only titles). Cache 1 day —
 * availability moves slowly but does change.
 */
export async function getWatchProvidersForTitle(
  tmdbId: number,
  kind: "movie" | "tv",
  region: string,
): Promise<WatchProvidersForTitle | null> {
  const raw = await tmdbFetch<unknown>(`/${kind}/${tmdbId}/watch/providers`, {
    revalidate: 60 * 60 * 24,
  });
  const parsed = tmdbWatchProvidersByRegionResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  const regionData = parsed.data.results[region];
  const flatrate = regionData?.flatrate ?? [];
  if (flatrate.length === 0) return null;

  return {
    link: regionData?.link ?? null,
    flatrate: flatrate.sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999)),
  };
}

/**
 * Resolves the IMDb id for a TMDB title. Used to enrich Discover cards with
 * Rotten Tomatoes / IMDb ratings via OMDb. Cached for a week — these never
 * change once assigned.
 */
export async function getImdbId(tmdbId: number, kind: "movie" | "tv"): Promise<string | null> {
  const raw = await tmdbFetch<unknown>(`/${kind}/${tmdbId}/external_ids`, {
    revalidate: 60 * 60 * 24 * 7,
  });
  const parsed = tmdbExternalIdsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const value = parsed.data.imdb_id;
  return value && value !== "N/A" ? value : null;
}
