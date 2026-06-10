import "server-only";

const ANILIST_URL = "https://graphql.anilist.co";

// Anime rows store the MAL id; AniList looks titles up by `idMal`. `externalLinks`
// carries streaming sites with a brand `icon` (a small logo) and a deep link.
const STREAMING_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      externalLinks { site url type icon }
    }
  }
`;

export type AnimeStreamingProvider = {
  /** Provider/site name (e.g. "Crunchyroll"). */
  name: string;
  /** Deep link to the title on that provider. */
  url: string;
  /** AniList-hosted brand icon, or null when unavailable / off-CDN. */
  iconUrl: string | null;
};

/** Keep only icons AniList serves from its own CDN, so next/image (which is
 *  scoped to `**.anilist.co`) never throws on an unconfigured remote host. */
function safeIcon(icon: string | null | undefined): string | null {
  if (typeof icon !== "string" || icon.length === 0) return null;
  try {
    return new URL(icon).hostname.endsWith("anilist.co") ? icon : null;
  } catch {
    return null;
  }
}

/**
 * Streaming providers for an anime from AniList's `externalLinks` (filtered to
 * STREAMING), keyed by MAL id. Each carries the site name, a deep link, and a
 * brand icon URL when AniList has one. Returns an empty array on any failure or
 * when there are no streaming links. Cached 24h.
 */
export async function getAnilistStreamingProviders(
  malId: string,
): Promise<AnimeStreamingProvider[]> {
  const id = Number.parseInt(malId, 10);
  if (!Number.isFinite(id)) return [];

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: STREAMING_QUERY, variables: { idMal: id } }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data?: {
        Media?: {
          externalLinks?:
            | { site?: string; url?: string; type?: string; icon?: string | null }[]
            | null;
        } | null;
      };
    };

    const links = json.data?.Media?.externalLinks ?? [];
    const seen = new Set<string>();
    const out: AnimeStreamingProvider[] = [];
    for (const link of links) {
      if (link?.type !== "STREAMING") continue;
      const name = typeof link.site === "string" ? link.site : "";
      const url = typeof link.url === "string" ? link.url : "";
      if (!name || !url || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, url, iconUrl: safeIcon(link.icon) });
    }
    return out;
  } catch (error) {
    console.warn("[anilist-streaming] failed:", error);
    return [];
  }
}
