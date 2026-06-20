import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * robots.txt. Everything is crawlable except API routes and the OAuth callback;
 * the private app pages already carry `robots: noindex` via the (app) layout and
 * redirect anonymous crawlers to /login, so they don't need an explicit
 * Disallow. Points crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().origin;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
