import "server-only";

import { discoverAnime, getAnimeGenres } from "@/lib/jikan/discover";
import type { JikanAnime } from "@/lib/jikan/schemas";
import { createClient } from "@/lib/supabase/server";
import { discoverMovies, discoverTv } from "@/lib/tmdb/discover";
import type { TmdbMovie, TmdbTv } from "@/lib/tmdb/schemas";
import { getTrendingFor } from "./queries";

export type ForYouResult = {
  movies: TmdbMovie[];
  tv: TmdbTv[];
  anime: JikanAnime[];
  /** True when the library is empty and we fell back to plain trending. */
  fallback: boolean;
};

const ITEMS_PER_KIND = 8;
const TOP_GENRES = 3;

/**
 * Builds a personalized recommendations payload by mining the user's library
 * for their most-watched genres per kind, then pulling fresh /discover (or
 * /top/anime) results that exclude what they already have.
 *
 * If the library is empty, returns trending lists so the tab is never blank.
 */
export async function getForYou(): Promise<ForYouResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { movies: [], tv: [], anime: [], fallback: true };
  }

  const { data: items } = await supabase
    .from("media_items")
    .select("source, source_id, kind, genres")
    .eq("user_id", user.id);

  const library = items ?? [];
  if (library.length === 0) {
    return await fallbackToTrending();
  }

  const movieGenreCounts = new Map<number, number>();
  const tvGenreCounts = new Map<number, number>();
  const animeGenreNames = new Map<string, number>();
  const excludeMovieIds = new Set<string>();
  const excludeTvIds = new Set<string>();
  const excludeAnimeIds = new Set<string>();

  for (const item of library) {
    const genres = Array.isArray(item.genres) ? item.genres : [];
    if (item.kind === "movie") {
      excludeMovieIds.add(item.source_id);
      for (const g of genres) {
        if (typeof g === "number") {
          movieGenreCounts.set(g, (movieGenreCounts.get(g) ?? 0) + 1);
        }
      }
    } else if (item.kind === "tv") {
      excludeTvIds.add(item.source_id);
      for (const g of genres) {
        if (typeof g === "number") {
          tvGenreCounts.set(g, (tvGenreCounts.get(g) ?? 0) + 1);
        }
      }
    } else if (item.kind === "anime") {
      excludeAnimeIds.add(item.source_id);
      for (const g of genres) {
        if (typeof g === "string") {
          animeGenreNames.set(g, (animeGenreNames.get(g) ?? 0) + 1);
        }
      }
    }
  }

  const topMovieGenres = topN(movieGenreCounts);
  const topTvGenres = topN(tvGenreCounts);
  const topAnimeNames = topN(animeGenreNames);

  // Anime filter takes numeric mal_ids; map names → ids via the genre catalog.
  let topAnimeGenreIds: number[] = [];
  if (topAnimeNames.length > 0) {
    const catalog = await getAnimeGenres().catch(() => []);
    const nameToId = new Map(catalog.map((g) => [g.name.toLowerCase(), g.mal_id]));
    topAnimeGenreIds = topAnimeNames
      .map((name) => nameToId.get(name.toLowerCase()))
      .filter((id): id is number => typeof id === "number");
  }

  const [movies, tv, anime] = await Promise.all([
    topMovieGenres.length > 0
      ? discoverMovies({ withGenres: topMovieGenres, sortBy: "popularity.desc", minVote: 6 })
      : Promise.resolve([]),
    topTvGenres.length > 0
      ? discoverTv({ withGenres: topTvGenres, sortBy: "popularity.desc", minVote: 6 })
      : Promise.resolve([]),
    topAnimeGenreIds.length > 0
      ? discoverAnime({ genres: topAnimeGenreIds, minScore: 7 })
      : Promise.resolve([]),
  ]);

  return {
    movies: movies.filter((m) => !excludeMovieIds.has(String(m.id))).slice(0, ITEMS_PER_KIND),
    tv: tv.filter((t) => !excludeTvIds.has(String(t.id))).slice(0, ITEMS_PER_KIND),
    anime: anime.filter((a) => !excludeAnimeIds.has(String(a.mal_id))).slice(0, ITEMS_PER_KIND),
    fallback: false,
  };
}

async function fallbackToTrending(): Promise<ForYouResult> {
  const [movies, tv, anime] = await Promise.all([
    getTrendingFor("movie"),
    getTrendingFor("tv"),
    getTrendingFor("anime"),
  ]);
  return {
    movies:
      movies.kind === "tmdb"
        ? (movies.items.filter((i) => i.media_type === "movie") as TmdbMovie[]).slice(
            0,
            ITEMS_PER_KIND,
          )
        : [],
    tv:
      tv.kind === "tmdb"
        ? (tv.items.filter((i) => i.media_type === "tv") as TmdbTv[]).slice(0, ITEMS_PER_KIND)
        : [],
    anime: anime.kind === "anime" ? anime.items.slice(0, ITEMS_PER_KIND) : [],
    fallback: true,
  };
}

function topN<K>(counts: Map<K, number>): K[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRES)
    .map(([key]) => key);
}
