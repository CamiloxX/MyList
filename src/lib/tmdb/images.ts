/**
 * Pure URL builders for TMDB image CDN — safe to import from client components.
 *
 * Lives in its own file (not tmdb/client.ts) because that module marks itself
 * `server-only` to gate the API key, and webpack will refuse to bundle it
 * into a Client Component even when only the pure helper is used.
 */

/** Build full image URL from a TMDB poster/still path (e.g. "/abc.jpg"). */
export function tmdbImage(
  path: string | null | undefined,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
