import "server-only";

import { serverEnv } from "@/lib/env/server";

// Re-export the pure image-URL helper so existing server-side imports keep
// working unchanged. Client components must import from "./images" directly
// to avoid pulling this server-only module into their bundle.
export { tmdbImage } from "./images";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_ORIGIN = "https://api.themoviedb.org";

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
  // Defense-in-depth against a user-controlled `path` (e.g. an unvalidated
  // source_id with "../" or "?"): reject anything that escapes the TMDB v3 host
  // or path prefix before the request carries our secret api_key.
  if (url.origin !== TMDB_ORIGIN || !url.pathname.startsWith("/3/")) {
    throw new Error("Invalid TMDB request path");
  }
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
