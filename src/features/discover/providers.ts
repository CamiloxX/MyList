import "server-only";

import { getWatchProvidersForTitle, type WatchProvidersForTitle } from "@/lib/tmdb/discover";
import type { TmdbSearchResult } from "@/lib/tmdb/schemas";

export type ProvidersByTmdbId = Map<number, WatchProvidersForTitle>;

/**
 * Resolves "where to watch" providers for a batch of TMDB items in `region`,
 * in parallel. Returns a map keyed by TMDB id; missing entries mean either
 * no flatrate availability in that region or a TMDB lookup error (we swallow
 * those — a missing logo row is better than a broken card).
 */
export async function fetchProvidersForTmdbItems(
  items: ReadonlyArray<TmdbSearchResult>,
  region: string,
): Promise<ProvidersByTmdbId> {
  const result: ProvidersByTmdbId = new Map();
  if (items.length === 0) return result;

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const data = await getWatchProvidersForTitle(item.id, item.media_type, region);
      if (!data) return null;
      return [item.id, data] as const;
    }),
  );

  for (const outcome of settled) {
    if (outcome.status === "fulfilled" && outcome.value) {
      const [id, data] = outcome.value;
      result.set(id, data);
    }
  }
  return result;
}
