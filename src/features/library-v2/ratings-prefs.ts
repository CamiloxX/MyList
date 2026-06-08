/**
 * Shared constants for the "show ratings on covers" preference. Lives in its own
 * module (no "server-only") so both the server components that read the cookie
 * and the client toggle that writes it can import the same name.
 */
export const RATINGS_COOKIE = "mylist_v2_ratings";

/** Cover ratings are shown by default; the cookie only stores an explicit "off". */
export function ratingsEnabledFromCookie(value: string | undefined): boolean {
  return value !== "0";
}
