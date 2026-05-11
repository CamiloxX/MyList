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
} from "@/lib/tmdb/discover";
import type { TmdbGenre, TmdbSearchResult } from "@/lib/tmdb/schemas";
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

/** Trending list for the active type. */
export async function getTrendingFor(type: DiscoverType): Promise<DiscoverList> {
  if (type === "anime") {
    // "airing" returns what's emitting *this season*, ranked by score —
    // closer in spirit to TMDB's weekly trending than MAL's all-time popularity.
    const items = await getTopAnime({ filter: "airing", type: "tv" });
    return { kind: "anime", items };
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
): Promise<DiscoverList> {
  if (type === "movie") {
    const filters: DiscoverFilters = {
      withGenres: genreId ? [genreId] : undefined,
      year,
      sortBy: "popularity.desc",
    };
    const items = await discoverMovies(filters);
    return { kind: "tmdb", items };
  }
  if (type === "tv") {
    const filters: DiscoverFilters = {
      withGenres: genreId ? [genreId] : undefined,
      year,
      sortBy: "popularity.desc",
    };
    const items = await discoverTv(filters);
    return { kind: "tmdb", items };
  }
  const filters: DiscoverAnimeFilters = {
    genres: genreId ? [genreId] : undefined,
    year,
  };
  const items = await discoverAnime(filters);
  return { kind: "anime", items };
}
