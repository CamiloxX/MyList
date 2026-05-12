"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { tmdbImage } from "@/lib/tmdb/client";
import type { TmdbEpisode } from "@/lib/tmdb/tv";
import { cn } from "@/lib/utils";
import { loadSeasonEpisodes } from "../seasons-actions";
import { SeasonToggle } from "./season-toggle";

type Props = {
  mediaItemId: string;
  tmdbId: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airYear: string | null;
  posterUrl: string | null;
  initialWatched: boolean;
};

/**
 * Single row inside the seasons list. Holds local UI state for the expand
 * toggle and lazy-loads the episode list the first time the user opens it,
 * then keeps it in memory for the rest of the session so re-opens are free.
 *
 * The mark-as-watched toggle stays as its own button — separate concern from
 * the expand affordance.
 */
export function SeasonRow({
  mediaItemId,
  tmdbId,
  seasonNumber,
  name,
  episodeCount,
  airYear,
  posterUrl,
  initialWatched,
}: Props) {
  const t = useTranslations("library.seasons");
  const [isExpanded, setIsExpanded] = useState(false);
  const [episodes, setEpisodes] = useState<TmdbEpisode[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, startLoading] = useTransition();

  const handleToggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && episodes === null && !isLoading) {
      startLoading(async () => {
        const result = await loadSeasonEpisodes(tmdbId, seasonNumber);
        if (result.ok) {
          setEpisodes(result.episodes);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      });
    }
  };

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t("collapseSeason") : t("expandSeason")}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUpIcon className="size-4" aria-hidden />
          ) : (
            <ChevronDownIcon className="size-4" aria-hidden />
          )}
        </button>
        <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {posterUrl ? (
            <Image src={posterUrl} alt="" fill sizes="48px" className="object-cover" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {t("episodeCount", { count: episodeCount })}
            {airYear ? ` · ${airYear}` : ""}
          </span>
        </div>
        <SeasonToggle
          mediaItemId={mediaItemId}
          seasonNumber={seasonNumber}
          initialWatched={initialWatched}
        />
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t bg-muted/30 px-3 py-3">
            {isLoading && episodes === null ? (
              <p className="text-xs text-muted-foreground">{t("loadingEpisodes")}</p>
            ) : loadError ? (
              <p className="text-xs text-destructive">{t("loadError")}</p>
            ) : episodes && episodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noEpisodes")}</p>
            ) : episodes ? (
              <ol className="flex flex-col gap-2">
                {episodes.map((ep) => (
                  <li key={ep.id} className="flex gap-3">
                    <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded bg-muted sm:w-28">
                      {ep.still_path ? (
                        <Image
                          src={tmdbImage(ep.still_path, "w185") ?? ""}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 112px, 96px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                          {ep.episode_number}
                        </span>
                        <span className="truncate text-sm font-medium">{ep.name}</span>
                      </div>
                      {ep.air_date ? (
                        <span className="text-[11px] text-muted-foreground">{ep.air_date}</span>
                      ) : null}
                      {ep.overview ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{ep.overview}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
