/**
 * Absolute base URL of the deployed site, for SEO: `metadataBase` (so OG /
 * canonical / image URLs resolve to absolute), `robots` and the `sitemap`.
 * Resolves, in order: an explicit `NEXT_PUBLIC_SITE_URL`, Vercel's production
 * domain (`VERCEL_PROJECT_PRODUCTION_URL`, injected automatically), then a
 * localhost fallback for local dev. Server-side use (reads non-public env).
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}
