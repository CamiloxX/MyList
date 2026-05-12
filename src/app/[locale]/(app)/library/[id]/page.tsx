import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RemoveButton } from "@/features/library/components/remove-button";
import { SeasonsList } from "@/features/library/components/seasons-list";
import { StatusSelect } from "@/features/library/components/status-select";
import { TrailerButton } from "@/features/library/components/trailer-button";
import { WatchEntryForm } from "@/features/library/components/watch-entry-form";
import { WatchEntryList } from "@/features/library/components/watch-entry-list";
import type { MediaStatus } from "@/features/library/status";
import { Link } from "@/i18n/navigation";
import { getJikanTrailer } from "@/lib/jikan/videos";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { createClient } from "@/lib/supabase/server";
import { getTmdbTrailer } from "@/lib/tmdb/videos";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MediaDetailPage({ params }: DetailPageProps) {
  await loadingDemoDelay();
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase.from("media_items").select("*").eq("id", id).maybeSingle();

  if (!item) {
    notFound();
  }

  const [{ data: entries }, trailer] = await Promise.all([
    supabase
      .from("watch_entries")
      .select("id, watched_on, rating, platform, notes, season_number")
      .eq("media_item_id", id)
      .order("watched_on", { ascending: false }),
    fetchTrailerFor(item.source, item.kind, item.source_id),
  ]);

  const entriesList = entries ?? [];
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/library"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground",
        )}
      >
        {t("library.detail.back")}
      </Link>

      <article className="relative isolate overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        {/* Backdrop: the same poster blown up + heavily blurred behind the
            content, with a gradient scrim so text stays readable on light AND
            dark themes. Hidden from assistive tech — purely decorative. */}
        {item.poster_url ? (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={item.poster_url}
              alt=""
              fill
              sizes="100vw"
              className="scale-125 object-cover blur-2xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/70 to-background/85" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
          </div>
        ) : (
          <div className="absolute inset-0 -z-10 bg-card" aria-hidden />
        )}

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
          <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-md bg-muted shadow-lg ring-1 ring-foreground/10 sm:w-40">
            {item.poster_url ? (
              <Image
                src={item.poster_url}
                alt={t("posters.alt", { title: item.title })}
                fill
                sizes="(min-width: 640px) 160px, 128px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {t("common.noPoster")}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <header className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight drop-shadow-sm">
                  {item.title}
                </h1>
                <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
                {item.year ? (
                  <span className="text-sm text-muted-foreground">{item.year}</span>
                ) : null}
              </div>
              {item.original_title && item.original_title !== item.title ? (
                <p className="text-sm text-muted-foreground">{item.original_title}</p>
              ) : null}
            </header>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect id={item.id} current={item.status as MediaStatus} />
              {trailer ? (
                <TrailerButton youtubeKey={trailer.youtubeKey} title={item.title} />
              ) : null}
              <RemoveButton id={item.id} title={item.title} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("library.detail.entriesCount", { count: entriesList.length })}
            </p>
          </div>
        </div>
      </article>

      {item.kind === "tv" && item.source === "tmdb" ? (
        <SeasonsList mediaItemId={item.id} tmdbId={item.source_id} />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("library.detail.history")}</h2>
        <WatchEntryList entries={entriesList} mediaItemId={item.id} />
      </section>

      <section className="flex flex-col gap-3">
        <WatchEntryForm mediaItemId={item.id} />
      </section>
    </div>
  );
}

/**
 * Routes the trailer lookup to the right provider based on where the title
 * came from. Anime entries fan out to Jikan/MyAnimeList; movies and TV go
 * through TMDB. Anything else (or any failure) returns null and the watch
 * trailer button just doesn't render.
 */
async function fetchTrailerFor(
  source: string,
  kind: string,
  sourceId: string,
): Promise<{ youtubeKey: string } | null> {
  if (source === "tmdb" && (kind === "movie" || kind === "tv")) {
    return getTmdbTrailer(kind, sourceId);
  }
  if (source === "anilist" && kind === "anime") {
    return getJikanTrailer(sourceId);
  }
  return null;
}
