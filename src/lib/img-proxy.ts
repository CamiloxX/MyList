/**
 * Routes a remote image through our own `/api/img` proxy so the browser loads it
 * from OUR domain instead of the origin host. Provider logos (image.tmdb.org,
 * s4.anilist.co) are a frequent target of ad/tracking blockers and network
 * filters that drop them by host or by the `/link/icon/` path — proxying dodges
 * that, since the request now goes to our domain and the original URL is
 * base64url-encoded into the path (so a blocker can't pattern-match it).
 *
 * Server-side use only (uses Buffer); the provider rows that call it are server
 * components. Returns null for falsy input so callers can skip the <img>.
 */
export function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null;
  return `/api/img/${Buffer.from(url, "utf8").toString("base64url")}`;
}
