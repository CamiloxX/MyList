import { PlayIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProvidersRow } from "@/features/discover/components/providers-row";
import { RatingsBadge } from "@/features/discover/components/ratings-badge";
import { EpisodeTracker } from "@/features/library/components/episode-tracker";
import { NextEpisodeCard } from "@/features/library/components/next-episode-card";
import { NotifyEpisodesToggle } from "@/features/library/components/notify-episodes-toggle";
import { RemoveButton } from "@/features/library/components/remove-button";
import { SeasonsList } from "@/features/library/components/seasons-list";
import { StatusSelect } from "@/features/library/components/status-select";
import { TrailerButton } from "@/features/library/components/trailer-button";
import { WatchEntryList } from "@/features/library/components/watch-entry-list";
import { WatchEntryTrigger } from "@/features/library/components/watch-entry-trigger";
import type { MediaStatus } from "@/features/library/status";
import {
  getBackdropUrl,
  getSourceScore,
  getSynopsis,
  loadSeriesDetail,
  resolveGenreNames,
} from "@/features/library-v2/detail-data";
import { AddToListButton } from "@/features/lists/components/add-to-list-button";
import { TitleComments } from "@/features/title-comments/components/title-comments";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ log?: string }>;
};

export default async function LibraryV2DetailPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params;
  const { log } = (await searchParams) ?? {};
  const defaultOpenLog = log === "true";

  const data = await loadSeriesDetail(id);
  if (!data) notFound();
  const { item, entries, watchUrl, trailer, providers, airing, nextEpisode, lists, ratings } = data;

  const t = await getTranslations();
  const format = await getFormatter();
  const synopsis = getSynopsis(item);
  const score = getSourceScore(item);
  const genreNames = await resolveGenreNames(item);
  const backdropUrl = getBackdropUrl(item);

  const isSeries = item.kind === "tv" || item.kind === "anime";
  const watchedEpisodes = item.episodes_watched ?? 0;
  const totalEpisodes = item.episode_count ?? 0;
  const progressPct =
    totalEpisodes > 0 ? Math.min(100, Math.round((watchedEpisodes / totalEpisodes) * 100)) : null;

  // Format the "next episode" card (code + Colombia-time date). Mirrors the
  // existing detail page; the live countdown runs client-side in NextEpisodeCard.
  let nextEpisodeCode: string | null = null;
  let nextEpisodeDate: string | null = null;
  let nextEpisodeTime: string | null = null;
  if (nextEpisode?.airDateIso) {
    if (nextEpisode.seasonNumber != null && nextEpisode.episodeNumber != null) {
      nextEpisodeCode = t("library.detail.nextEpisode.tvCode", {
        season: nextEpisode.seasonNumber,
        episode: nextEpisode.episodeNumber,
      });
    } else if (nextEpisode.episodeNumber != null) {
      nextEpisodeCode = t("library.detail.nextEpisode.animeCode", {
        episode: nextEpisode.episodeNumber,
      });
    }
    const airDate = new Date(nextEpisode.airDateIso);
    nextEpisodeDate = format.dateTime(airDate, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "America/Bogota",
    });
    if (nextEpisode.hasExactTime) {
      nextEpisodeTime = format.dateTime(airDate, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Bogota",
      });
    }
  }

  const detailRows: Array<[string, string]> = [
    [t("libraryV2.detail.labelType"), t(`kinds.${item.kind}`)],
    ...(item.year
      ? [[t("libraryV2.detail.labelYear"), String(item.year)] as [string, string]]
      : []),
    ...(item.original_title && item.original_title !== item.title
      ? [[t("libraryV2.detail.labelOriginalTitle"), item.original_title] as [string, string]]
      : []),
    ...(airing !== "unknown" && isSeries
      ? [
          [t("libraryV2.detail.labelStatus"), t(`library.detail.airing.${airing}`)] as [
            string,
            string,
          ],
        ]
      : []),
    ...(score ? [[t("libraryV2.detail.labelScore"), `${score} / 10`] as [string, string]] : []),
  ];

  return (
    <div className="flex flex-col">
      {/* Cinematic backdrop hero */}
      <header className="relative isolate overflow-hidden">
        {backdropUrl ? (
          // Real 16:9 key-art (TMDB): shown sharp, anchored to the top, fading
          // into the page background so the poster + title sit on solid color.
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={backdropUrl}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40" />
          </div>
        ) : item.poster_url ? (
          // Fallback for titles without a backdrop (e.g. anime): blurred poster.
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={item.poster_url}
              alt=""
              fill
              sizes="100vw"
              className="scale-125 object-cover blur-2xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
            <div className="absolute inset-0 [background:radial-gradient(circle_at_78%_12%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_55%)]" />
            {/* Giant first-letter watermark, like the design's faint "S". */}
            <span className="pointer-events-none absolute -top-10 right-6 select-none text-[260px] font-extrabold leading-none tracking-tighter text-foreground/[0.05]">
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 -z-10 bg-card" aria-hidden />
        )}

        <div className="relative px-6 pt-6 lg:px-10">
          <Link
            href="/library-v2"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "gap-2 bg-background/50 backdrop-blur",
            )}
          >
            {t("library.detail.back")}
          </Link>
        </div>

        <div className="relative flex flex-col gap-6 px-6 pb-10 pt-28 sm:flex-row sm:items-end sm:pt-44 lg:px-10">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-2xl sm:w-48">
            {item.poster_url ? (
              <Image
                src={item.poster_url}
                alt={t("posters.alt", { title: item.title })}
                fill
                sizes="(min-width: 640px) 192px, 160px"
                className="object-cover"
                style={{ viewTransitionName: `poster-${item.id}` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {t("common.noPoster")}
              </div>
            )}
            {nextEpisode?.airDateIso && nextEpisodeDate ? (
              <NextEpisodeCard
                airDateIso={nextEpisode.airDateIso}
                episodeCode={nextEpisodeCode}
                dateLabel={nextEpisodeDate}
                timeLabel={nextEpisodeTime}
              />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
              {airing !== "unknown" && isSeries ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-transparent",
                    airing === "airing" &&
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    airing === "upcoming" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                    airing === "ended" && "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`library.detail.airing.${airing}`)}
                </Badge>
              ) : null}
              {genreNames.map((g) => (
                <Badge key={g} variant="outline" className="bg-background/40 backdrop-blur">
                  {g}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
              {item.title}
            </h1>
            {item.original_title && item.original_title !== item.title ? (
              <p className="text-sm text-muted-foreground">{item.original_title}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {score ? (
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <StarIcon className="size-4 fill-current" aria-hidden />
                  {score}
                </span>
              ) : null}
              {item.year ? <span>{item.year}</span> : null}
              {totalEpisodes > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{t("libraryV2.episodes", { count: totalEpisodes })}</span>
                </>
              ) : null}
            </div>
            {ratings ? <RatingsBadge ratings={ratings} /> : null}
          </div>
        </div>
      </header>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-10">
        {/* Left: actions, synopsis, episodes, history */}
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusSelect id={item.id} current={item.status as MediaStatus} />
            {watchUrl ? (
              <a
                href={watchUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "gap-2 bg-emerald-600 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700",
                )}
              >
                <PlayIcon className="size-4 shrink-0 fill-current" aria-hidden />
                <span>{t("library.detail.watchNow")}</span>
              </a>
            ) : null}
            {trailer ? <TrailerButton youtubeKey={trailer.youtubeKey} title={item.title} /> : null}
            {isSeries ? <NotifyEpisodesToggle id={item.id} initial={item.notify_episodes} /> : null}
            <AddToListButton mediaItemId={item.id} lists={lists} />
            <RemoveButton id={item.id} title={item.title} />
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("libraryV2.detail.synopsis")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {synopsis ?? t("libraryV2.detail.noSynopsis")}
            </p>
          </section>

          {item.kind === "tv" && item.source === "tmdb" ? (
            <section className="flex flex-col gap-3">
              <SeasonsList mediaItemId={item.id} tmdbId={item.source_id} />
            </section>
          ) : null}

          {item.kind === "anime" ? (
            <EpisodeTracker
              mediaItemId={item.id}
              total={item.episode_count}
              initialWatched={item.episodes_watched}
            />
          ) : null}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("library.detail.history")}
              </h2>
              <WatchEntryTrigger mediaItemId={item.id} defaultOpen={defaultOpenLog} />
            </div>
            <WatchEntryList entries={entries} mediaItemId={item.id} />
          </section>
        </div>

        {/* Right: progress, details, providers */}
        <aside className="flex flex-col gap-5">
          {item.kind === "anime" && progressPct != null ? (
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t("libraryV2.detail.progress")}</span>
                <span className="text-sm font-bold text-primary">{progressPct}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("libraryV2.detail.progressLine", {
                  watched: watchedEpisodes,
                  total: totalEpisodes,
                })}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold tracking-tight">
              {t("libraryV2.detail.details")}
            </h3>
            <dl className="flex flex-col gap-3">
              {detailRows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {providers ? (
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold tracking-tight">
                {t("libraryV2.detail.availableOn")}
              </h3>
              {providers.type === "tmdb" ? (
                <ProvidersRow data={providers.data} max={8} />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {providers.items.map((p) => (
                    <a
                      key={p.url}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
                    >
                      {p.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      <div className="px-6 pb-12 lg:px-10">
        <TitleComments source={item.source} sourceId={item.source_id} kind={item.kind} />
      </div>
    </div>
  );
}
