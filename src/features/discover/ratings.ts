import "server-only";

import { serverEnv } from "@/lib/env/server";
import { getOmdbRatings } from "@/lib/omdb/client";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { getImdbId } from "@/lib/tmdb/discover";
import type { TmdbSearchResult } from "@/lib/tmdb/schemas";

export type RatingsByTmdbId = Map<number, OmdbRatings>;

/**
 * Resolves OMDb ratings for a batch of TMDB items in parallel. The map is
 * keyed by TMDB id so callers can do `ratings.get(item.id)` without caring
 * about the IMDb resolution roundtrip.
 *
 * Returns an empty map when OMDB_API_KEY is not configured — the UI then
 * silently omits the badge.
 */
export async function fetchRatingsForTmdbItems(
  items: ReadonlyArray<TmdbSearchResult>,
): Promise<RatingsByTmdbId> {
  const result: RatingsByTmdbId = new Map();
  if (!serverEnv.OMDB_API_KEY || items.length === 0) return result;

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const imdbId = await getImdbId(item.id, item.media_type);
      if (!imdbId) return null;
      const ratings = await getOmdbRatings(imdbId);
      if (!ratings) return null;
      return [item.id, ratings] as const;
    }),
  );

  for (const outcome of settled) {
    if (outcome.status === "fulfilled" && outcome.value) {
      const [id, ratings] = outcome.value;
      result.set(id, ratings);
    }
  }
  return result;
}
