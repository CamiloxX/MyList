import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { AddToLibraryButton } from "@/features/library/components/add-to-library-button";
import {
  type JikanAnime,
  jikanDurationMinutes,
  jikanFormatLabel,
  jikanOriginalTitle,
  jikanPoster,
  jikanTitle,
} from "@/lib/jikan/search";

export async function AnimeCard({
  item,
  alreadyAdded = false,
}: {
  item: JikanAnime;
  /** When true, the Add button renders as already-added and is disabled. */
  alreadyAdded?: boolean;
}) {
  const title = jikanTitle(item);
  const originalTitle = jikanOriginalTitle(item);
  const poster = jikanPoster(item);
  const formatLabel = jikanFormatLabel(item);
  const runtimeMinutes = jikanDurationMinutes(item);
  const genreNames = item.genres.map((g) => g.name);
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
            <Badge variant="secondary">{t("kinds.anime")}</Badge>
            <Badge variant="outline">{formatLabel}</Badge>
            {item.year ? <span className="text-sm text-muted-foreground">{item.year}</span> : null}
          </div>
          {originalTitle ? (
            <p className="truncate text-xs text-muted-foreground">{originalTitle}</p>
          ) : null}
        </header>
        {item.synopsis ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{item.synopsis}</p>
        ) : null}
        <div className="mt-auto pt-1">
          <AddToLibraryButton
            source="anilist"
            sourceId={String(item.mal_id)}
            kind="anime"
            title={title}
            originalTitle={originalTitle}
            posterUrl={poster}
            year={item.year ?? null}
            runtimeMinutes={runtimeMinutes}
            episodeCount={item.episodes ?? null}
            genres={genreNames}
            rawMetadata={item}
            alreadyAdded={alreadyAdded}
          />
        </div>
      </div>
    </article>
  );
}
