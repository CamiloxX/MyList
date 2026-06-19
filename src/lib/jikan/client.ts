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

  const cachedInit: RequestInit = {
    next:
      options.revalidate === false ? { revalidate: 0 } : { revalidate: options.revalidate ?? 3600 },
  };

  // Jikan rate-limits hard (~3/s and ~60/min). A single 429 would otherwise drop
  // a franchise entry (it renders as "MAL #id", no poster) and, since failed
  // fetches aren't cached, it can keep failing on every render. Retry transient
  // 429/5xx with backoff; retries use `no-store` so Next's per-render request
  // memoization doesn't just hand back the memoized 429.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 900 * attempt));
    let response: Response;
    try {
      response = await fetch(url.toString(), attempt === 0 ? cachedInit : { cache: "no-store" });
    } catch (err) {
      lastError = err;
      continue;
    }
    if (response.ok) return (await response.json()) as T;
    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`Jikan ${response.status} ${response.statusText}`);
      continue;
    }
    // 4xx (e.g. 404) won't fix itself — fail fast.
    const body = await response.text().catch(() => "");
    throw new Error(`Jikan request failed (${response.status} ${response.statusText}): ${body}`);
  }
  throw lastError ?? new Error("Jikan request failed after retries");
}
