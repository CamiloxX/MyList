import "server-only";

import { serverEnv } from "@/lib/env/server";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbFetchOptions = {
  query?: Record<string, string | number | undefined>;
  /** Cache strategy. Default: 1 hour for catalog data; pass `0` to disable. */
  revalidate?: number | false;
};

/**
 * Fetches a TMDB API endpoint with the configured API key.
 * Throws on non-2xx responses with a descriptive message.
 */
export async function tmdbFetch<T>(path: string, options: TmdbFetchOptions = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", serverEnv.TMDB_API_KEY);
  url.searchParams.set("language", "es-ES");

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    next:
      options.revalidate === false ? { revalidate: 0 } : { revalidate: options.revalidate ?? 3600 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`TMDB request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return (await response.json()) as T;
}

/** Build full image URL from a TMDB poster path (e.g. "/abc.jpg"). */
export function tmdbImage(
  path: string | null | undefined,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
