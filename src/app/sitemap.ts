import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Re-crawl the dynamic public pages periodically; profiles/lists move slowly.
export const revalidate = 86400;

const LOCALES = ["es", "en"] as const;

/** Builds one entry per locale-prefixed path with hreflang alternates. */
function localizedEntry(
  base: string,
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`]));
  return {
    url: `${base}/es${path}`,
    changeFrequency,
    alternates: { languages },
  };
}

/**
 * Sitemap of the publicly indexable pages: the static entry points plus the
 * dynamic public surfaces (opt-in public profiles and official lists). Reads via
 * the service-role client (the profile read policy is gated to is_public); if it
 * isn't configured, falls back to just the static pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().origin;

  const entries: MetadataRoute.Sitemap = [
    localizedEntry(base, "", "weekly"),
    localizedEntry(base, "/login", "monthly"),
    localizedEntry(base, "/register", "monthly"),
  ];

  try {
    const supabase = createServiceRoleClient();
    const [profiles, lists] = await Promise.all([
      supabase.from("profiles").select("username").eq("is_public", true).limit(2000),
      supabase.from("lists").select("id").eq("is_official", true).limit(2000),
    ]);

    for (const row of profiles.data ?? []) {
      if (row.username) entries.push(localizedEntry(base, `/u/${row.username}`, "weekly"));
    }
    for (const row of lists.data ?? []) {
      entries.push(localizedEntry(base, `/share/${row.id}`, "weekly"));
    }
  } catch {
    // Service role not configured (or query failed): the static pages above are
    // still a valid sitemap.
  }

  return entries;
}
