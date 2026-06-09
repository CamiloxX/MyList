import "server-only";

const ANILIST_URL = "https://graphql.anilist.co";

// Anime rows store the MAL id; AniList looks titles up by `idMal`. `bannerImage`
// is a wide key-art banner (≈ a backdrop) — null for titles that don't have one.
const BANNER_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) { bannerImage }
  }
`;

/**
 * Wide hero banner for an anime from AniList, keyed by its MAL id. Returns a full
 * image URL or null (no banner / no AniList entry / failure) — callers then fall
 * back to the blurred poster. Cached 24h.
 */
export async function getAnilistBanner(malId: string): Promise<string | null> {
  const id = Number.parseInt(malId, 10);
  if (!Number.isFinite(id)) return null;

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: BANNER_QUERY, variables: { idMal: id } }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: { Media?: { bannerImage?: string | null } | null };
    };
    const banner = json.data?.Media?.bannerImage;
    return typeof banner === "string" && banner.length > 0 ? banner : null;
  } catch (error) {
    console.warn("[anilist-banner] failed:", error);
    return null;
  }
}
