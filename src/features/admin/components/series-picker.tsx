"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  type BadgeSeasonOption,
  type BadgeSeriesResult,
  getSeriesSeasonsForBadge,
  searchSeriesForBadge,
} from "../actions";
import { LibraryLinkInput } from "./library-link-input";

/** The `title_season` slice of BadgeCriterion the picker edits. */
type TitleSeasonValue = {
  source: "tmdb" | "anilist";
  sourceId: string;
  mediaKind: "movie" | "tv" | "anime";
  season: number;
};

/**
 * Picks a TMDB series + season for a `title_season` badge. Restricted to TMDB
 * tv on purpose: only TMDB series record a watched season_number, so other
 * kinds could never auto-unlock.
 */
export function SeriesPicker({
  value,
  initialLabel,
  onChange,
}: {
  value: TitleSeasonValue;
  /** Display label for an already-selected title (edit mode). */
  initialLabel?: string;
  onChange: (next: TitleSeasonValue) => void;
}) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const [results, setResults] = useState<BadgeSeriesResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel ?? null);
  const [seasons, setSeasons] = useState<BadgeSeasonOption[]>([]);
  const [loadingSeasons, startSeasons] = useTransition();

  // Run the typeahead whenever the debounced query changes.
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchSeriesForBadge(q));
    });
  }, [debounced]);

  // Load seasons whenever a series is selected (incl. on mount in edit mode).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on sourceId only — value/onChange/selectedLabel are read as their latest values when the series changes; adding them would refetch on every season tweak.
  useEffect(() => {
    if (!value.sourceId) {
      setSeasons([]);
      return;
    }
    startSeasons(async () => {
      const detail = await getSeriesSeasonsForBadge(value.sourceId);
      setSeasons(detail.seasons);
      // Edit mode opens with only an id; show the resolved series title.
      if (!selectedLabel && detail.title) setSelectedLabel(detail.title);
      // Keep the season select pointing at an option TMDB actually lists
      // (a stored season may be gone, or the first season may not be 1).
      const first = detail.seasons[0];
      if (first && !detail.seasons.some((s) => s.season === value.season)) {
        onChange({ ...value, season: first.season });
      }
    });
  }, [value.sourceId]);

  const handleSelect = (item: BadgeSeriesResult) => {
    setSelectedLabel(item.year ? `${item.title} (${item.year})` : item.title);
    setQuery("");
    setResults([]);
    onChange({
      source: item.source,
      sourceId: item.sourceId,
      mediaKind: item.mediaKind,
      season: 1,
    });
  };

  const clearSelection = () => {
    setSelectedLabel(null);
    setSeasons([]);
    onChange({ source: "tmdb", sourceId: "", mediaKind: "tv", season: 1 });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t("condition.titleSeasonHint")}</p>

      {value.sourceId ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="min-w-0 truncate text-sm">
            {selectedLabel ?? t("condition.selectedFallback", { id: value.sourceId })}
          </span>
          <button
            type="button"
            onClick={clearSelection}
            aria-label={t("condition.clear")}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("condition.searchTitle")}
            className="pl-9"
          />
          {isSearching ? (
            <Loader2Icon
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
      )}

      {!value.sourceId && results.length > 0 ? (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
          {results.map((item) => (
            <li key={item.sourceId}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
              >
                {item.posterUrl ? (
                  // biome-ignore lint/performance/noImgElement: TMDB poster on an external host; next/image needs per-host config.
                  <img
                    src={item.posterUrl}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-12 w-8 shrink-0 rounded bg-muted" aria-hidden />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  {item.year ? (
                    <span className="block text-xs text-muted-foreground">{item.year}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!value.sourceId ? (
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("condition.linkOr")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <LibraryLinkInput
            onResolved={(r) =>
              handleSelect({
                source: "tmdb",
                sourceId: r.sourceId,
                mediaKind: "tv",
                title: r.title,
                year: r.year,
                posterUrl: r.posterUrl,
              })
            }
            accept={(r) =>
              r.source === "tmdb" && r.mediaKind === "tv" ? null : t("condition.linkNotSeries")
            }
          />
        </>
      ) : null}

      {value.sourceId ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("condition.season")}</span>
          {seasons.length > 0 ? (
            <Select
              value={String(value.season)}
              onValueChange={(v) => {
                if (v) onChange({ ...value, season: Number(v) });
              }}
            >
              <SelectTrigger className={cn("w-full", loadingSeasons && "opacity-60")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.season} value={String(s.season)}>
                    {s.name} · {t("condition.seasonNumber", { n: s.season })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              min={1}
              value={value.season}
              onChange={(e) =>
                onChange({ ...value, season: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
