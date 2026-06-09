import { cookies } from "next/headers";
import type { ForYouResult } from "@/features/discover/recommend";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { animeToPoster, movieToPoster, tvToPoster } from "../data";
import { fetchPosterRatings } from "../ratings";
import { RATINGS_COOKIE, ratingsEnabledFromCookie } from "../ratings-prefs";
import type { PosterItem } from "../types";
import { CarouselRow } from "./carousel-row";

/** Round-robin merge so the single row mixes movies, tv and anime. */
function interleave(lists: PosterItem[][], limit: number): PosterItem[] {
  const out: PosterItem[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max && out.length < limit; i++) {
    for (const list of lists) {
      const item = list[i];
      if (item && out.length < limit) out.push(item);
    }
  }
  return out;
}

/**
 * Desktop "For you": one full-width auto-scrolling carousel that mixes movies,
 * tv and anime together (the look the recommendations had in the library).
 * RT/IMDb overlays are fetched (bounded) only when the cover-ratings toggle is on.
 */
export async function ForYouCarousels({ result }: { result: ForYouResult }) {
  const showRatings = ratingsEnabledFromCookie((await cookies()).get(RATINGS_COOKIE)?.value);

  const recRatings: Map<string, OmdbRatings> = showRatings
    ? await fetchPosterRatings([
        ...result.movies.map((m) => ({ id: m.id, kind: "movie" as const })),
        ...result.tv.map((tv) => ({ id: tv.id, kind: "tv" as const })),
      ])
    : new Map();
  const withRatings = (p: PosterItem): PosterItem => ({
    ...p,
    ratings: recRatings.get(p.key) ?? null,
  });

  const items = interleave(
    [
      result.movies.map(movieToPoster).map(withRatings),
      result.tv.map(tvToPoster).map(withRatings),
      result.anime.map(animeToPoster),
    ],
    24,
  );

  return <CarouselRow items={items} />;
}
