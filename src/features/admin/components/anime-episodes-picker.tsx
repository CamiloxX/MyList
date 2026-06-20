"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { type BadgeTitleResult, searchTitlesForBadge } from "../actions";
import { LibraryLinkInput } from "./library-link-input";

/** The `title_episodes` slice of BadgeCriterion the picker edits. */
type EpisodesValue = {
  source: "anilist";
  sourceId: string;
  episodes: number;
  title?: string;
};

/**
 * Picks an anime + an episode count for a `title_episodes` badge, which unlocks
 * when the user has watched at least N episodes of that anime. Anime-only:
 * episode tracking only exists for anime (TV uses per-season marks).
 */
export function AnimeEpisodesPicker({
  value,
  onChange,
}: {
  value: EpisodesValue;
  onChange: (next: EpisodesValue) => void;
}) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const [results, setResults] = useState<BadgeTitleResult[]>([]);
  const [isSearching, startSearch] = useTransition();

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchTitlesForBadge(q, "anime"));
    });
  }, [debounced]);

  const handleSelect = (item: BadgeTitleResult) => {
    setQuery("");
    setResults([]);
    onChange({
      source: "anilist",
      sourceId: item.sourceId,
      episodes: value.episodes,
      title: item.year ? `${item.title} (${item.year})` : item.title,
    });
  };

  const clearSelection = () => {
    onChange({ source: "anilist", sourceId: "", episodes: value.episodes, title: undefined });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t("condition.titleEpisodesHint")}</p>

      {value.sourceId ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="min-w-0 truncate text-sm">
            {value.title ?? t("condition.titleFallback", { id: value.sourceId })}
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
        <>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("condition.searchAnime")}
              className="pl-9"
            />
            {isSearching ? (
              <Loader2Icon
                className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>

          {results.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
              {results.map((item) => (
                <li key={`${item.source}-${item.sourceId}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
                  >
                    {item.posterUrl ? (
                      // biome-ignore lint/performance/noImgElement: external poster host; next/image needs per-host config.
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("condition.linkOr")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <LibraryLinkInput
            onResolved={handleSelect}
            accept={(r) => (r.mediaKind === "anime" ? null : t("condition.linkNotAnime"))}
          />
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="criterion-episodes">{t("condition.episodes")}</Label>
        <Input
          id="criterion-episodes"
          type="number"
          min={1}
          value={value.episodes}
          onChange={(e) =>
            onChange({ ...value, episodes: Math.max(1, Number(e.target.value) || 1) })
          }
        />
      </div>
    </div>
  );
}
