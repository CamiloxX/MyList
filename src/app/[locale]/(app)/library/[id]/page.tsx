import { PlayIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProvidersRow } from "@/features/discover/components/providers-row";
import { getMediaWatchUrl } from "@/features/library/actions";
import { NextEpisodeCard } from "@/features/library/components/next-episode-card";
import { NotifyEpisodesToggle } from "@/features/library/components/notify-episodes-toggle";
import { RemoveButton } from "@/features/library/components/remove-button";
import { SeasonsList } from "@/features/library/components/seasons-list";
import { StatusSelect } from "@/features/library/components/status-select";
import { TrailerButton } from "@/features/library/components/trailer-button";
import { WatchEntryList } from "@/features/library/components/watch-entry-list";
import { WatchEntryTrigger } from "@/features/library/components/watch-entry-trigger";
import type { MediaStatus } from "@/features/library/status";
import { AddToListButton } from "@/features/lists/components/add-to-list-button";
import { getListsForItem } from "@/features/lists/queries";
import { TitleComments } from "@/features/title-comments/components/title-comments";
import { Link } from "@/i18n/navigation";
import type { AiringStatus } from "@/lib/airing-status";
import { getAnilistNextEpisode } from "@/lib/anilist/next-episode";
import { getJikanAiringStatus } from "@/lib/jikan/airing";
import { getJikanTrailer } from "@/lib/jikan/videos";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { createClient } from "@/lib/supabase/server";
import type { WatchProvidersForTitle } from "@/lib/tmdb/discover";
import { getTmdbTvAiringStatus, getTmdbTvNextEpisode } from "@/lib/tmdb/tv";
import { getTmdbTrailer } from "@/lib/tmdb/videos";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ log?: string }>;
};

export default async function MediaDetailPage({ params, searchParams }: DetailPageProps) {
  await loadingDemoDelay();
  const { id } = await params;
  const { log } = (await searchParams) ?? {};
  const defaultOpenLog = log === "true";
  const supabase = await createClient();

  const { data: item } = await supabase.from("media_items").select("*").eq("id", id).maybeSingle();

  if (!item) {
    notFound();
  }

  const [watchUrl, { data: entries }, trailer, providers, airing, nextEpisode, listMemberships] =
    await Promise.all([
      getMediaWatchUrl(id).catch(() => null),
      supabase
        .from("watch_entries")
        .select("id, watched_on, rating, platform, notes, season_number")
        .eq("media_item_id", id)
        .order("watched_on", { ascending: false }),
      fetchTrailerFor(item.source, item.kind, item.source_id),
      fetchWatchProviders(item.source, item.kind, item.source_id),
      fetchAiringStatus(item.source, item.kind, item.source_id),
      fetchNextEpisode(item.source, item.kind, item.source_id),
      getListsForItem(item.id),
    ]);

  const entriesList = entries ?? [];
  const t = await getTranslations();
  const format = await getFormatter();

  // Build the "next episode" card data: an episode code (T2E5 / Ep 5) plus an
  // absolute date (and time for anime) formatted in Colombia time. The live
  // countdown itself is computed client-side in <NextEpisodeCard>.
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
                style={{ viewTransitionName: `poster-${item.id}` }}
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
                {airing !== "unknown" && (item.kind === "tv" || item.kind === "anime") ? (
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
                {item.year ? (
                  <span className="text-sm text-muted-foreground">{item.year}</span>
                ) : null}
              </div>
              {item.original_title && item.original_title !== item.title ? (
                <p className="text-sm text-muted-foreground">{item.original_title}</p>
              ) : null}
            </header>
            {nextEpisode?.airDateIso && nextEpisodeDate ? (
              <NextEpisodeCard
                airDateIso={nextEpisode.airDateIso}
                episodeCode={nextEpisodeCode}
                dateLabel={nextEpisodeDate}
                timeLabel={nextEpisodeTime}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect id={item.id} current={item.status as MediaStatus} />
              {watchUrl ? (
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors",
                  )}
                >
                  <PlayIcon className="size-4 shrink-0 fill-current" aria-hidden />
                  <span>{t("library.detail.watchNow")}</span>
                </a>
              ) : null}
              {trailer ? (
                <TrailerButton youtubeKey={trailer.youtubeKey} title={item.title} />
              ) : null}
              {item.kind === "tv" || item.kind === "anime" ? (
                <NotifyEpisodesToggle id={item.id} initial={item.notify_episodes} />
              ) : null}
              <AddToListButton mediaItemId={item.id} lists={listMemberships} />
              <RemoveButton id={item.id} title={item.title} />
            </div>
            {providers ? (
              providers.type === "tmdb" ? (
                <ProvidersRow data={providers.data} max={6} />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("discover.providersRow.label")}
                  </span>
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
              )
            ) : null}
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium">{t("library.detail.history")}</h2>
          <div className="hidden sm:block">
            <WatchEntryTrigger mediaItemId={item.id} defaultOpen={defaultOpenLog} />
          </div>
        </div>
        <WatchEntryList entries={entriesList} mediaItemId={item.id} />
        <div className="sm:hidden">
          <WatchEntryTrigger mediaItemId={item.id} defaultOpen={defaultOpenLog} />
        </div>
      </section>

      <TitleComments source={item.source} sourceId={item.source_id} kind={item.kind} />
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

type DetailProviders =
  | { type: "tmdb"; data: WatchProvidersForTitle }
  | { type: "anime"; items: { name: string; url: string }[] }
  | null;

/**
 * Resolves where a title can be watched, for the "available on" row. TMDB
 * movies/TV return provider logos (rendered via ProvidersRow); anime goes to
 * Jikan, which gives per-provider names + direct URLs but no logos, so those
 * render as linked chips. Region is fixed to Colombia, matching the watch URL.
 */
async function fetchWatchProviders(
  source: string,
  kind: string,
  sourceId: string,
): Promise<DetailProviders> {
  if (source === "tmdb" && (kind === "movie" || kind === "tv")) {
    const { getWatchProvidersForTitle } = await import("@/lib/tmdb/discover");
    const data = await getWatchProvidersForTitle(Number.parseInt(sourceId, 10), kind, "CO").catch(
      () => null,
    );
    return data ? { type: "tmdb", data } : null;
  }
  if (source === "anilist" && kind === "anime") {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${sourceId}/streaming`);
      if (res.ok) {
        const json = (await res.json()) as { data?: { name?: string; url?: string }[] };
        const items = (json.data ?? [])
          .map((p) => ({ name: p.name ?? "", url: p.url ?? "" }))
          .filter((p) => p.name !== "" && p.url !== "");
        if (items.length > 0) return { type: "anime", items };
      }
    } catch (e) {
      console.warn("[fetchWatchProviders] Failed to fetch Jikan streaming info:", e);
    }
  }
  return null;
}

/**
 * Resolves the airing state (en emisión / finalizada / próximamente) for the
 * detail-page badge. Only series and anime have one; everything else is unknown.
 */
async function fetchAiringStatus(
  source: string,
  kind: string,
  sourceId: string,
): Promise<AiringStatus> {
  if (source === "tmdb" && kind === "tv") return getTmdbTvAiringStatus(sourceId);
  if (source === "anilist" && kind === "anime") return getJikanAiringStatus(sourceId);
  return "unknown";
}

type NextEpisodeInfo = {
  seasonNumber: number | null;
  episodeNumber: number | null;
  /** ISO instant to format. TMDB date is anchored at noon UTC to avoid the
   *  date-only value rolling to the previous day in Colombia (UTC-5). */
  airDateIso: string | null;
  /** AniList gives an exact airing instant (show the time); TMDB only a date. */
  hasExactTime: boolean;
};

/**
 * Next scheduled episode for series (TMDB, exact date) and anime (AniList,
 * exact timestamp via the stored MAL id). Null for movies / finished shows.
 */
async function fetchNextEpisode(
  source: string,
  kind: string,
  sourceId: string,
): Promise<NextEpisodeInfo | null> {
  if (source === "tmdb" && kind === "tv") {
    const ep = await getTmdbTvNextEpisode(sourceId);
    if (!ep?.airDate) return null;
    return {
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      airDateIso: `${ep.airDate}T12:00:00Z`,
      hasExactTime: false,
    };
  }
  if (source === "anilist" && kind === "anime") {
    const ep = await getAnilistNextEpisode(sourceId);
    if (!ep) return null;
    return {
      seasonNumber: null,
      episodeNumber: ep.episode,
      airDateIso: new Date(ep.airingAt * 1000).toISOString(),
      hasExactTime: true,
    };
  }
  return null;
}
