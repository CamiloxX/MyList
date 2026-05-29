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
  air_date: z.string().nullable().optional(),
  episode_number: z.number().nullable().optional(),
  season_number: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
});

const tmdbTvAiringSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_episode_to_air: tmdbEpisodeSchema.nullable().optional(),
});

export type TmdbEpisode = {
  airDate: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  name: string | null;
};

/**
 * Fetches the most recently aired episode of a TV show (TMDB's
 * `last_episode_to_air`). Used by the new-episode cron to tell whether a show a
 * user is watching dropped an episode today. Returns null if the show has no
 * aired episode yet or the request fails.
 *
 * Cached for 1h: the cron runs once a day, so each daily run re-fetches fresh,
 * but the short TTL also dedupes the case where many users track the same show.
 */
export async function getTmdbTvLastEpisode(id: string): Promise<TmdbEpisode | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${id}`, { revalidate: 3600 });
    const parsed = tmdbTvAiringSchema.parse(raw);
    const ep = parsed.last_episode_to_air;
    if (!ep) return null;
    return {
      airDate: ep.air_date ?? null,
      episodeNumber: ep.episode_number ?? null,
      seasonNumber: ep.season_number ?? null,
      name: ep.name ?? null,
    };
  } catch (error) {
    console.warn("[tmdb-tv-last-episode] failed:", error);
    return null;
  }
}
