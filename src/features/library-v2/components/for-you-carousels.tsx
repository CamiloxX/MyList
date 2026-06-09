import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ForYouResult } from "@/features/discover/recommend";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { animeToPoster, movieToPoster, tvToPoster } from "../data";
import { fetchPosterRatings } from "../ratings";
import { RATINGS_COOKIE, ratingsEnabledFromCookie } from "../ratings-prefs";
import type { PosterItem } from "../types";
import { CarouselRow } from "./carousel-row";

/**
 * Desktop "For you" rendered as the v2 auto-scrolling carousels (one per kind),
 * the same look the recommendations had in the library. RT/IMDb overlays are
 * fetched (bounded) only when the cover-ratings toggle is on.
 */
export async function ForYouCarousels({ result }: { result: ForYouResult }) {
  const t = await getTranslations("discover.forYou");
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

  const movies = result.movies.map(movieToPoster).map(withRatings);
  const tv = result.tv.map(tvToPoster).map(withRatings);
  const anime = result.anime.map(animeToPoster);

  return (
    <div className="flex flex-col gap-10">
      {movies.length > 0 ? <CarouselRow title={t("sectionMovies")} items={movies} /> : null}
      {tv.length > 0 ? <CarouselRow title={t("sectionTv")} items={tv} /> : null}
      {anime.length > 0 ? <CarouselRow title={t("sectionAnime")} items={anime} /> : null}
    </div>
  );
}
