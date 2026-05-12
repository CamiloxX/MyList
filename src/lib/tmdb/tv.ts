import "server-only";

import { z } from "zod";
import { tmdbFetch } from "./client";

const tmdbSeasonSchema = z.object({
  id: z.number(),
  season_number: z.number(),
  name: z.string(),
  overview: z.string().nullable().optional(),
  episode_count: z.number().nullable().optional(),
  air_date: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
});
export type TmdbSeason = z.infer<typeof tmdbSeasonSchema>;

const tmdbTvDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  number_of_seasons: z.number().nullable().optional(),
  seasons: z.array(tmdbSeasonSchema).default([]),
});

/**
 * Fetches a TMDB TV show's metadata, including its seasons array. Filters out
 * the synthetic "Specials" entry (season_number = 0) by default since users
 * tracking what they watched almost never want it counted as a real season.
 *
 * Returns null on any failure so callers can degrade to "no seasons UI"
 * gracefully instead of erroring the whole detail page.
 *
 * Cached for 24h — show metadata changes rarely and we hit this on every
 * detail-page render.
 */
export async function getTmdbTvSeasons(id: string): Promise<TmdbSeason[] | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${id}`, { revalidate: 86400 });
    const parsed = tmdbTvDetailSchema.parse(raw);
    return parsed.seasons.filter((s) => s.season_number > 0);
  } catch (error) {
    console.warn("[tmdb-tv-seasons] failed:", error);
    return null;
  }
}

const tmdbEpisodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  episode_number: z.number(),
  overview: z.string().nullable().optional(),
  air_date: z.string().nullable().optional(),
  runtime: z.number().nullable().optional(),
  still_path: z.string().nullable().optional(),
});
export type TmdbEpisode = z.infer<typeof tmdbEpisodeSchema>;

const tmdbSeasonDetailSchema = z.object({
  season_number: z.number(),
  name: z.string(),
  episodes: z.array(tmdbEpisodeSchema).default([]),
});

/**
 * Fetches the full episode list for one season of a TMDB TV show. Used when
 * the user expands a season row in the SeasonsList — the per-season detail
 * is too big to ship for every show on the detail page render, so it loads
 * lazily on click.
 *
 * Returns null on failure (network, schema mismatch) and the expand UI
 * surfaces an inline "no se pudieron cargar" message.
 */
export async function getTmdbSeasonEpisodes(
  tvId: string,
  seasonNumber: number,
): Promise<TmdbEpisode[] | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${tvId}/season/${seasonNumber}`, {
      revalidate: 86400,
    });
    return tmdbSeasonDetailSchema.parse(raw).episodes;
  } catch (error) {
    console.warn("[tmdb-season-episodes] failed:", error);
    return null;
  }
}
