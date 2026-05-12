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
