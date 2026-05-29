import "server-only";

const ANILIST_URL = "https://graphql.anilist.co";

// Our anime rows store the MyAnimeList id as source_id (via Jikan), and AniList
// lets you look a title up by `idMal`, so we can reuse that id without storing
// AniList's own id. `nextAiringEpisode` is null when the show isn't airing.
const NEXT_EPISODE_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      nextAiringEpisode { episode airingAt }
    }
  }
`;

export type AnilistNextEpisode = {
  episode: number;
  /** Unix seconds (UTC) when the episode airs. */
  airingAt: number;
};

/**
 * Fetches the next airing episode (number + exact timestamp) for an anime from
 * AniList, keyed by its MAL id. Returns null when the show isn't currently
 * airing, has no AniList entry, or on any failure.
 */
export async function getAnilistNextEpisode(malId: string): Promise<AnilistNextEpisode | null> {
  const id = Number.parseInt(malId, 10);
  if (!Number.isFinite(id)) return null;

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: NEXT_EPISODE_QUERY, variables: { idMal: id } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        Media?: { nextAiringEpisode?: { episode?: number; airingAt?: number } | null } | null;
      };
    };
    const nae = json.data?.Media?.nextAiringEpisode;
    if (!nae || typeof nae.episode !== "number" || typeof nae.airingAt !== "number") {
      return null;
    }
    return { episode: nae.episode, airingAt: nae.airingAt };
  } catch (error) {
    console.warn("[anilist-next-episode] failed:", error);
    return null;
  }
}
