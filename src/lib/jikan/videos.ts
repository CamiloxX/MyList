import "server-only";

import { z } from "zod";
import { jikanFetch } from "./client";

const trailerSchema = z.object({
  youtube_id: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

const animeDetailSchema = z.object({
  trailer: trailerSchema.nullable().optional(),
  title: z.string(),
});

const responseSchema = z.object({ data: animeDetailSchema });

export type JikanTrailer = { youtubeKey: string; name: string };

/**
 * Returns the YouTube trailer attached to a Jikan/MyAnimeList anime entry.
 * MAL ships a single canonical trailer per anime (or none), so this is a
 * straight read of `data.trailer.youtube_id`. Returns null on network errors
 * or when the entry has no trailer.
 *
 * Cached for 24h; MAL rarely updates trailers and Jikan has a soft rate limit
 * we want to respect.
 */
export async function getJikanTrailer(malId: string): Promise<JikanTrailer | null> {
  try {
    const raw = await jikanFetch<unknown>(`/anime/${malId}`, { revalidate: 86400 });
    const parsed = responseSchema.parse(raw);
    const youtubeKey = parsed.data.trailer?.youtube_id;
    if (!youtubeKey) return null;
    return { youtubeKey, name: parsed.data.title };
  } catch (error) {
    console.warn("[jikan-trailer] failed:", error);
    return null;
  }
}
