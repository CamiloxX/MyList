import "server-only";

import { jikanFetch } from "./client";
import { type JikanAnime, jikanSearchResponseSchema } from "./schemas";

export type { JikanAnime } from "./schemas";

/**
 * Search Jikan (MyAnimeList) for anime by free-text query.
 * Note: AniList was the originally chosen anime source, but its public
 * `search:` parameter was returning empty for any query at the time of
 * implementation (2026-05-10). Jikan was reliable in side-by-side tests,
 * so we use it as the active anime source.
 */
export async function searchJikan(query: string): Promise<JikanAnime[]> {
  if (!query.trim()) return [];

  const raw = await jikanFetch<unknown>("/anime", {
    query: { q: query, limit: 15, order_by: "popularity", sort: "asc" },
    revalidate: 0,
  });

  const parsed = jikanSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Jikan returned an unexpected payload: ${parsed.error.message}`);
  }

  return parsed.data.data;
}

/** Display title preference: english → romaji (title) → japanese. */
export function jikanTitle(item: JikanAnime): string {
  return (
    item.title_english?.trim() ||
    item.title?.trim() ||
    item.title_japanese?.trim() ||
    `MAL #${item.mal_id}`
  );
}

/** Original (japanese) title, if different from the display title. */
export function jikanOriginalTitle(item: JikanAnime): string | undefined {
  const display = jikanTitle(item);
  const original = item.title?.trim() || item.title_japanese?.trim();
  return original && original !== display ? original : undefined;
}

/** Pick the best poster URL (large > image > small). */
export function jikanPoster(item: JikanAnime): string | null {
  const raw =
    item.images?.webp?.large_image_url ??
    item.images?.jpg?.large_image_url ??
    item.images?.webp?.image_url ??
    item.images?.jpg?.image_url ??
    null;
  return normalizeMalImageUrl(raw);
}

/**
 * Jikan sometimes returns image URLs hosted on `myanimelist.net` and sometimes
 * on `cdn.myanimelist.net`. The first form gets blocked by Next's image
 * optimizer when local DNS resolves it to a private IP (VPN/WARP/captive
 * setups). Rewriting to the CDN avoids the issue without changing the asset.
 */
function normalizeMalImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/myanimelist\.net\//, "https://cdn.myanimelist.net/");
}

/** Spanish label for Jikan media type. */
export function jikanFormatLabel(item: JikanAnime): string {
  switch (item.type) {
    case "Movie":
      return "Película";
    case "TV":
      return "TV";
    case "OVA":
      return "OVA";
    case "ONA":
      return "ONA";
    case "Special":
      return "Especial";
    case "Music":
      return "Música";
    default:
      return item.type ?? "Anime";
  }
}

/** Extract numeric duration in minutes from Jikan's `duration` string (e.g. "23 min per ep"). */
export function jikanDurationMinutes(item: JikanAnime): number | null {
  if (!item.duration) return null;
  const match = item.duration.match(/(\d+)\s*min/);
  if (!match?.[1]) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}
