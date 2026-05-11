import "server-only";

import {
  type DiscoverAnimeFilters,
  discoverAnime,
  getAnimeGenres,
  getTopAnime,
} from "@/lib/jikan/discover";
import type { JikanAnime, JikanGenre } from "@/lib/jikan/schemas";
import {
  type DiscoverFilters,
  discoverMovies,
  discoverTv,
  getMovieGenres,
  getTrending,
  getTvGenres,
  getWatchProviders,
} from "@/lib/tmdb/discover";
import type { TmdbGenre, TmdbSearchResult, TmdbWatchProvider } from "@/lib/tmdb/schemas";
import type { DiscoverType } from "./schemas";

export type DiscoverGenre = { id: number; name: string };

/**
 * Returns the genre catalog for the active media type. Both TMDB and Jikan
 * give us numeric ids, so the UI can treat them uniformly.
 */
export async function getGenresFor(type: DiscoverType): Promise<DiscoverGenre[]> {
  if (type === "movie") {
    const list = await getMovieGenres();
    return normalizeTmdb(list);
  }
  if (type === "tv") {
    const list = await getTvGenres();
    return normalizeTmdb(list);
  }
  const list = await getAnimeGenres();
  return normalizeJikan(list);
}

function normalizeTmdb(list: TmdbGenre[]): DiscoverGenre[] {
  return list.map((g) => ({ id: g.id, name: g.name }));
}

function normalizeJikan(list: JikanGenre[]): DiscoverGenre[] {
  return list.map((g) => ({ id: g.mal_id, name: g.name }));
}

export type DiscoverTmdbList = { kind: "tmdb"; items: TmdbSearchResult[] };
export type DiscoverAnimeList = { kind: "anime"; items: JikanAnime[] };
export type DiscoverList = DiscoverTmdbList | DiscoverAnimeList;

export type CommonFetchParams = {
  page?: number;
  region?: string;
  provider?: number;
};

/**
 * Trending list for the active type. When a streaming provider is selected
 * we fall back to /discover sorted by popularity, since /trending does not
 * accept the watch_providers filter.
 */
export async function getTrendingFor(
  type: DiscoverType,
  params: CommonFetchParams = {},
): Promise<DiscoverList> {
  const { page, region, provider } = params;

  if (type === "anime") {
    // Anime ignores region/provider — Jikan does not expose those filters.
    const items = await getTopAnime({ filter: "airing", type: "tv", page });
    return { kind: "anime", items };
  }

  if (provider && region) {
    // Provider filter requires /discover; emulate "trending" via popularity sort.
    const filters: DiscoverFilters = {
      sortBy: "popularity.desc",
      page,
      region,
      withWatchProviders: [provider],
    };
    const items = type === "movie" ? await discoverMovies(filters) : await discoverTv(filters);
    return { kind: "tmdb", items };
  }

  const items = await getTrending(type, "week");
  return { kind: "tmdb", items };
}

/**
 * "By genre" list for the active type. If no genre is selected, falls back
 * to a popularity-sorted list (still cached, still cheap), so the page is
 * never blank.
 */
export async function getByGenreFor(
  type: DiscoverType,
  genreId: number | undefined,
  year: number | undefined,
  params: CommonFetchParams = {},
): Promise<DiscoverList> {
  const { page, region, provider } = params;

  if (type === "movie") {
    const filters: DiscoverFilters = {
      withGenres: genreId ? [genreId] : undefined,
      year,
      sortBy: "popularity.desc",
      page,
      region,
      withWatchProviders: provider ? [provider] : undefined,
    };
    const items = await discoverMovies(filters);
    return { kind: "tmdb", items };
  }
  if (type === "tv") {
    const filters: DiscoverFilters = {
      withGenres: genreId ? [genreId] : undefined,
      year,
      sortBy: "popularity.desc",
      page,
      region,
      withWatchProviders: provider ? [provider] : undefined,
    };
    const items = await discoverTv(filters);
    return { kind: "tmdb", items };
  }
  const filters: DiscoverAnimeFilters = {
    genres: genreId ? [genreId] : undefined,
    year,
    page,
  };
  const items = await discoverAnime(filters);
  return { kind: "anime", items };
}

export type DiscoverProvider = { id: number; name: string; logoPath: string | null };

/**
 * Streaming providers available in `region` for the chosen kind. Anime is not
 * supported (Jikan has no equivalent), so callers should skip the dropdown.
 */
export async function getProvidersFor(
  type: Exclude<DiscoverType, "anime">,
  region: string,
): Promise<DiscoverProvider[]> {
  const list = await getWatchProviders(type, region);
  return list.map(normalizeProvider);
}

function normalizeProvider(p: TmdbWatchProvider): DiscoverProvider {
  return { id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null };
}
