import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { RatingsBadge } from "@/features/discover/components/ratings-badge";
import { AddToLibraryButton } from "@/features/library/components/add-to-library-button";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { tmdbImage } from "@/lib/tmdb/client";
import { type TmdbSearchResult, tmdbOriginalTitle, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";

export async function MediaCard({
  item,
  ratings,
}: {
  item: TmdbSearchResult;
  /** Optional OMDb ratings (RT / IMDb / Meta). Discover passes them; Search omits. */
  ratings?: OmdbRatings | null;
}) {
  const title = tmdbTitle(item);
  const originalTitle = tmdbOriginalTitle(item);
  const year = tmdbYear(item);
  const poster = tmdbImage(item.poster_path, "w342");
  const overview = item.overview?.trim();
  const t = await getTranslations();

  return (
    <article className="flex gap-4 rounded-xl border bg-card p-3 shadow-sm">
      <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {poster ? (
          <Image
            src={poster}
            alt={t("posters.alt", { title })}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {t("common.noPoster")}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-medium">{title}</h3>
            <Badge variant="secondary">{t(`kinds.${item.media_type}`)}</Badge>
            {year ? <span className="text-sm text-muted-foreground">{year}</span> : null}
          </div>
          {originalTitle && originalTitle !== title ? (
            <p className="truncate text-xs text-muted-foreground">{originalTitle}</p>
          ) : null}
        </header>
        {ratings ? <RatingsBadge ratings={ratings} /> : null}
        {overview ? <p className="line-clamp-3 text-sm text-muted-foreground">{overview}</p> : null}
        <div className="mt-auto pt-1">
          <AddToLibraryButton
            source="tmdb"
            sourceId={String(item.id)}
            kind={item.media_type}
            title={title}
            originalTitle={originalTitle}
            posterUrl={poster}
            year={year}
            genres={item.genre_ids ?? []}
            rawMetadata={item}
          />
        </div>
      </div>
    </article>
  );
}
