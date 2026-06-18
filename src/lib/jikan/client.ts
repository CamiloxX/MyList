import "server-only";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const JIKAN_ORIGIN = "https://api.jikan.moe";

export type JikanFetchOptions = {
  query?: Record<string, string | number | undefined>;
  /** Cache TTL in seconds. Default 1 hour. Pass `false` to disable. */
  revalidate?: number | false;
};

/**
 * Fetches a Jikan endpoint. Jikan is the unofficial REST API for MyAnimeList
 * and does not require auth. Has a soft rate limit (~3 req/s), so callers
 * should debounce on the client.
 */
export async function jikanFetch<T>(path: string, options: JikanFetchOptions = {}): Promise<T> {
  const url = new URL(`${JIKAN_BASE_URL}${path}`);
  // Defense-in-depth against a user-controlled `path` (unvalidated source_id):
  // reject anything that escapes the Jikan v4 host or path prefix.
  if (url.origin !== JIKAN_ORIGIN || !url.pathname.startsWith("/v4/")) {
    throw new Error("Invalid Jikan request path");
  }

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
    throw new Error(`Jikan request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return (await response.json()) as T;
}
