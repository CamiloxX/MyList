import "server-only";

import { z } from "zod";
import type { AiringStatus } from "@/lib/airing-status";
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

/**
 * Like getTmdbTvSeasons but also returns the show's display name. Used by the
 * admin badge panel so an already-selected `title_season` shows the series
 * title (not just its numeric id) when editing.
 */
export async function getTmdbTvSummary(
  id: string,
): Promise<{ name: string; seasons: TmdbSeason[] } | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${id}`, { revalidate: 86400 });
    const parsed = tmdbTvDetailSchema.parse(raw);
    return { name: parsed.name, seasons: parsed.seasons.filter((s) => s.season_number > 0) };
  } catch (error) {
    console.warn("[tmdb-tv-summary] failed:", error);
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

const tmdbTvStatusSchema = z.object({
  id: z.number(),
  // "Returning Series" | "Ended" | "Canceled" | "In Production" | "Planned"
  status: z.string().nullable().optional(),
  next_episode_to_air: tmdbEpisodeSchema.nullable().optional(),
  last_episode_to_air: tmdbEpisodeSchema.nullable().optional(),
});

/**
 * Classifies a TMDB show's airing state for the detail-page badge and the
 * "notify new episodes" auto-toggle. A pending `next_episode_to_air` is the
 * strongest "more is coming" signal; otherwise we fall back to TMDB's `status`.
 * Returns "unknown" on failure so callers just skip the badge.
 */
export async function getTmdbTvAiringStatus(id: string): Promise<AiringStatus> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${id}`, { revalidate: 3600 });
    const parsed = tmdbTvStatusSchema.parse(raw);
    if (parsed.next_episode_to_air) return "airing";
    const status = (parsed.status ?? "").toLowerCase();
    if (status.includes("ended") || status.includes("cancel")) return "ended";
    if (status === "returning series") return "airing";
    if (status === "planned") return "upcoming";
    if (status === "in production") return parsed.last_episode_to_air ? "airing" : "upcoming";
    if (parsed.last_episode_to_air) return "ended";
    return "unknown";
  } catch (error) {
    console.warn("[tmdb-tv-airing-status] failed:", error);
    return "unknown";
  }
}

/**
 * Fetches the next episode scheduled to air for a TV show (TMDB's
 * `next_episode_to_air`, which carries an exact date). Returns null when the
 * show has nothing scheduled or the request fails.
 */
export async function getTmdbTvNextEpisode(id: string): Promise<TmdbEpisode | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${id}`, { revalidate: 3600 });
    const parsed = tmdbTvStatusSchema.parse(raw);
    const ep = parsed.next_episode_to_air;
    if (!ep) return null;
    return {
      airDate: ep.air_date ?? null,
      episodeNumber: ep.episode_number ?? null,
      seasonNumber: ep.season_number ?? null,
      name: ep.name ?? null,
    };
  } catch (error) {
    console.warn("[tmdb-tv-next-episode] failed:", error);
    return null;
  }
}
