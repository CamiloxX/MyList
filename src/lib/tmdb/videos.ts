import "server-only";

import { z } from "zod";
import { tmdbFetch } from "./client";

const tmdbVideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
  official: z.boolean().optional().default(false),
  iso_639_1: z.string().nullable().optional(),
});

const tmdbVideosResponseSchema = z.object({
  results: z.array(tmdbVideoSchema),
});

type TmdbVideo = z.infer<typeof tmdbVideoSchema>;

export type TmdbTrailer = {
  /** YouTube video id, ready to embed at /embed/{key}. */
  youtubeKey: string;
  /** TMDB-provided trailer name; useful as the dialog accessible name. */
  name: string;
};

async function fetchVideosForLanguage(
  kind: "movie" | "tv",
  id: string,
  language: string,
): Promise<TmdbVideo[]> {
  const raw = await tmdbFetch<unknown>(`/${kind}/${id}/videos`, {
    query: { language },
    revalidate: 86400,
  });
  return tmdbVideosResponseSchema.parse(raw).results;
}

function pickBestTrailer(videos: TmdbVideo[]): TmdbTrailer | null {
  const youtubeTrailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  if (youtubeTrailers.length === 0) return null;
  // Prefer official trailers over fan-made / unofficial uploads. TMDB returns
  // them in publish order, so within the same officiality bucket the first
  // result is the most recent — usually what users expect for "the" trailer.
  const sorted = [...youtubeTrailers].sort((a, b) => {
    if (a.official === b.official) return 0;
    return a.official ? -1 : 1;
  });
  const pick = sorted[0];
  return pick ? { youtubeKey: pick.key, name: pick.name } : null;
}

/**
 * Returns the best YouTube trailer for a TMDB movie or TV show. Tries the
 * Spanish locale first (matches the rest of the catalog data), falls back to
 * English when no Spanish trailer exists. Returns null on any failure or when
 * the title simply has no usable trailer — callers should treat null as
 * "hide the watch-trailer button" rather than as an error.
 *
 * Cached for 24h; trailer lists rarely churn.
 */
export async function getTmdbTrailer(
  kind: "movie" | "tv",
  id: string,
): Promise<TmdbTrailer | null> {
  try {
    const es = await fetchVideosForLanguage(kind, id, "es-ES");
    const trailer = pickBestTrailer(es);
    if (trailer) return trailer;
    const en = await fetchVideosForLanguage(kind, id, "en-US");
    return pickBestTrailer(en);
  } catch (error) {
    console.warn("[tmdb-trailer] failed:", error);
    return null;
  }
}
