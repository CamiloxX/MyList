import "server-only";

import { z } from "zod";
import { jikanFetch } from "./client";
import { type JikanAnime, jikanAnimeSchema } from "./schemas";

const animeByIdResponseSchema = z.object({ data: jikanAnimeSchema });

/**
 * Full Jikan metadata for one anime by MAL id. Cached 24h; same endpoint the
 * title preview uses, so traversing a franchise warms that cache. Null on failure.
 */
export async function getJikanAnimeById(malId: string | number): Promise<JikanAnime | null> {
  try {
    const raw = await jikanFetch<unknown>(`/anime/${malId}`, { revalidate: 86400 });
    return animeByIdResponseSchema.parse(raw).data;
  } catch (error) {
    console.warn("[jikan-anime] failed:", error);
    return null;
  }
}
