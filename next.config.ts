import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
      },
      {
        protocol: "https",
        hostname: "myanimelist.net",
        pathname: "/images/**",
      },
      {
        // AniList banner/cover CDN (anime hero images). Served from s1–s4.
        protocol: "https",
        hostname: "**.anilist.co",
      },
      {
        protocol: "https",
        hostname: "kefozbpfdbcdtsykbhws.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// Sentry wraps the config to upload source maps at build time (needs
// SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT; without them it only
// warns). tunnelRoute is deliberately OFF: the next-intl middleware would
// rewrite the tunnel path with a locale prefix and break it.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  webpack: { treeshake: { removeDebugLogging: true } },
});
