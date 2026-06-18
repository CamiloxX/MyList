import { StarIcon } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { ImdbWordmark, TomatoIcon } from "@/features/discover/components/score-icons";
import { PosterTransitionLink } from "@/features/library/components/poster-transition-link";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { cn } from "@/lib/utils";
import { RATINGS_COOKIE } from "../ratings-prefs";
import type { PosterItem } from "../types";

/**
 * Poster tile used across the desktop prototype (recommendations carousel,
 * genre browse, "Mi Biblioteca" grid). Reuses the app's theme tokens — no
 * bespoke palette — so it inherits light/dark automatically. A rating overlay
 * (RT/IMDb when available, else the source ⭐ score) is shown on the cover when
 * the global ratings toggle is on.
 */
export async function PosterCard({ item }: { item: PosterItem }) {
  const t = await getTranslations();
  const showRatings = (await cookies()).get(RATINGS_COOKIE)?.value !== "0";

  const body = (
    <>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={t("posters.alt", { title: item.title })}
            fill
            sizes="(max-width: 768px) 40vw, 180px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
            {t("common.noPoster")}
          </div>
        )}
        <span className="absolute bottom-2 left-2 z-10">
          <Badge variant="secondary" className="bg-background/75 backdrop-blur">
            {t(`kinds.${item.kind}`)}
          </Badge>
        </span>
        {showRatings ? <RatingOverlay ratings={item.ratings} score={item.score} /> : null}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
        {item.meta ? <p className="truncate text-xs text-muted-foreground">{item.meta}</p> : null}
      </div>
    </>
  );

  const className = cn("group block focus:outline-none");

  if (item.href) {
    return (
      <PosterTransitionLink href={item.href} className={className}>
        {body}
      </PosterTransitionLink>
    );
  }
  return <div className={className}>{body}</div>;
}

/**
 * Compact rating chip pinned to the poster's top-right (clearly visible over the
 * art). Prefers OMDb RT/IMDb (recommendations only); falls back to the TMDB/MAL
 * source score.
 */
function RatingOverlay({ ratings, score }: { ratings?: OmdbRatings | null; score?: string }) {
  // Top-right, diagonally opposite the kind badge (now bottom-left) so the two
  // never crowd each other on the narrow cards of the dense desktop grid. z-10
  // keeps it above the poster's GPU-composited hover scale (which would
  // otherwise paint over the overlay on hover).
  const chip =
    "absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/70 px-1.5 py-1 text-[11px] font-semibold text-white backdrop-blur tabular-nums";

  if (ratings) {
    const rt = Number.parseFloat(ratings.rottenTomatoes ?? "");
    const imdb = Number.parseFloat(ratings.imdb ?? "");
    const hasRt = Number.isFinite(rt);
    const hasImdb = Number.isFinite(imdb);
    if (hasRt || hasImdb) {
      return (
        <div className={chip}>
          {hasRt ? (
            <span className="inline-flex items-center gap-1">
              <TomatoIcon fresh={rt >= 60} className="size-3.5" />
              {Math.round(rt)}%
            </span>
          ) : null}
          {hasImdb ? (
            <span className="inline-flex items-center gap-1">
              <ImdbWordmark className="h-2.5 w-auto" />
              {imdb.toFixed(1)}
            </span>
          ) : null}
        </div>
      );
    }
  }

  if (score) {
    return (
      <div className={chip}>
        <StarIcon className="size-3 fill-amber-400 text-amber-400" aria-hidden />
        {score}
      </div>
    );
  }
  return null;
}
