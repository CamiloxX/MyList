import "server-only";

import { z } from "zod";
import type { AiringStatus } from "@/lib/airing-status";
import { jikanFetch } from "./client";

const animeAiringSchema = z.object({
  data: z.object({
    mal_id: z.number(),
    title: z.string(),
    // "Currently Airing" | "Finished Airing" | "Not yet aired"
    status: z.string().nullable().optional(),
    airing: z.boolean().nullable().optional(),
    broadcast: z
      .object({
        // e.g. "Mondays" (plural), or "Unknown"
        day: z.string().nullable().optional(),
        time: z.string().nullable().optional(),
        timezone: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
});

export type JikanAiring = {
  /** Whether the show is currently broadcasting new episodes. */
  airing: boolean;
  /** Broadcast weekday in MAL's plural form ("Mondays"), in JST. Null if unknown. */
  broadcastDay: string | null;
};

/**
 * Fetches an anime's airing status + weekly broadcast day from Jikan (MAL).
 * Unlike TMDB shows (which expose an exact `last_episode_to_air` date), MAL
 * only reliably gives a recurring weekday, so the new-episode cron notifies on
 * the broadcast day rather than a precise episode number. Returns null on
 * failure so the cron skips this title gracefully.
 *
 * Cached 1h to dedupe many users tracking the same anime within one daily run.
 */
export async function getJikanAiring(malId: string): Promise<JikanAiring | null> {
  try {
    const raw = await jikanFetch<unknown>(`/anime/${malId}`, { revalidate: 3600 });
    const parsed = animeAiringSchema.parse(raw);
    const d = parsed.data;
    return {
      airing: d.airing === true || d.status === "Currently Airing",
      broadcastDay: d.broadcast?.day ?? null,
    };
  } catch (error) {
    console.warn("[jikan-airing] failed:", error);
    return null;
  }
}

/**
 * Classifies an anime's airing state for the detail-page badge and the
 * "notify new episodes" auto-toggle. Returns "unknown" on failure.
 */
export async function getJikanAiringStatus(malId: string): Promise<AiringStatus> {
  try {
    const raw = await jikanFetch<unknown>(`/anime/${malId}`, { revalidate: 3600 });
    const parsed = animeAiringSchema.parse(raw);
    const d = parsed.data;
    if (d.airing === true || d.status === "Currently Airing") return "airing";
    if (d.status === "Not yet aired") return "upcoming";
    if (d.status === "Finished Airing") return "ended";
    return "unknown";
  } catch (error) {
    console.warn("[jikan-airing-status] failed:", error);
    return "unknown";
  }
}
