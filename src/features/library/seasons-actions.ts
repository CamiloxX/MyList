"use server";

import { getTmdbSeasonEpisodes, type TmdbEpisode } from "@/lib/tmdb/tv";

export type LoadEpisodesResult =
  | { ok: true; episodes: TmdbEpisode[] }
  | { ok: false; error: "load_failed" };

/**
 * Lazy-loads the episode list for one season when the user expands its row in
 * the library detail page. Kept as its own action (separate from the rest of
 * library/actions.ts) because it's read-only and doesn't touch the database.
 */
export async function loadSeasonEpisodes(
  tvId: string,
  seasonNumber: number,
): Promise<LoadEpisodesResult> {
  const episodes = await getTmdbSeasonEpisodes(tvId, seasonNumber);
  if (!episodes) return { ok: false, error: "load_failed" };
  return { ok: true, episodes };
}
