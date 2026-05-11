import "server-only";

import { serverEnv } from "@/lib/env/server";
import { type OmdbRatings, omdbResponseSchema } from "./schemas";

const OMDB_BASE_URL = "https://www.omdbapi.com/";

/** Cache ratings for a week. They barely move and OMDb has a 1k/day quota. */
const RATINGS_TTL = 60 * 60 * 24 * 7;

/**
 * Fetches ratings (IMDb / Rotten Tomatoes / Metacritic) for an IMDb id.
 *
 * Returns `null` when:
 *   - OMDB_API_KEY is not configured (Discover gracefully omits the badge).
 *   - imdbId is empty / null / "N/A".
 *   - OMDb says the title is unknown (`Response: "False"`).
 *   - The network call fails (we swallow the error to never break a card).
 */
export async function getOmdbRatings(imdbId: string | null | undefined): Promise<OmdbRatings | null> {
  if (!serverEnv.OMDB_API_KEY) return null;
  if (!imdbId || imdbId === "N/A") return null;

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("apikey", serverEnv.OMDB_API_KEY);
  url.searchParams.set("tomatoes", "true");

  let raw: unknown;
  try {
    const response = await fetch(url.toString(), { next: { revalidate: RATINGS_TTL } });
    if (!response.ok) return null;
    raw = await response.json();
  } catch {
    return null;
  }

  const parsed = omdbResponseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.Response === "False") return null;

  const hit = parsed.data;
  const findRating = (source: string) =>
    hit.Ratings.find((r) => r.Source.toLowerCase() === source.toLowerCase())?.Value ?? null;

  // Rotten Tomatoes comes formatted as "94%". Strip the % to keep the badge UI flexible.
  const rt = findRating("Rotten Tomatoes");
  const rottenTomatoes = rt ? rt.replace(/%/g, "").trim() : null;

  return {
    imdb: clean(hit.imdbRating),
    rottenTomatoes: clean(rottenTomatoes),
    metacritic: clean(hit.Metascore),
  };
}

function clean(value: string | null | undefined): string | null {
  if (!value || value === "N/A" || value.trim() === "") return null;
  return value.trim();
}
