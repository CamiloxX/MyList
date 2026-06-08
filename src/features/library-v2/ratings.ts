import "server-only";

import { getOmdbRatings } from "@/lib/omdb/client";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { getImdbId } from "@/lib/tmdb/discover";

/**
 * OMDb RT/IMDb/Metacritic ratings for a single TMDB title (resolves its IMDb id
 * first). Returns null for anime or anything without an IMDb match, or when
 * OMDB_API_KEY isn't configured — callers then omit the badge.
 */
export async function fetchTitleRatings(
  source: string,
  kind: string,
  sourceId: string,
): Promise<OmdbRatings | null> {
  if (source !== "tmdb" || (kind !== "movie" && kind !== "tv")) return null;
  const tmdbId = Number.parseInt(sourceId, 10);
  if (!Number.isFinite(tmdbId)) return null;
  const imdbId = await getImdbId(tmdbId, kind).catch(() => null);
  if (!imdbId) return null;
  return getOmdbRatings(imdbId).catch(() => null);
}

/**
 * Batch OMDb ratings for a bounded set of TMDB titles (the recommendations
 * carousel). Keyed by `${kind}-${id}` so it lines up with the poster cards'
 * `key`. Runs all lookups in parallel and tolerates per-title failures.
 */
export async function fetchPosterRatings(
  items: ReadonlyArray<{ id: number; kind: "movie" | "tv" }>,
): Promise<Map<string, OmdbRatings>> {
  const out = new Map<string, OmdbRatings>();
  if (items.length === 0) return out;

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const ratings = await fetchTitleRatings("tmdb", item.kind, String(item.id));
      return ratings ? ([`${item.kind}-${item.id}`, ratings] as const) : null;
    }),
  );
  for (const outcome of settled) {
    if (outcome.status === "fulfilled" && outcome.value) {
      out.set(outcome.value[0], outcome.value[1]);
    }
  }
  return out;
}
