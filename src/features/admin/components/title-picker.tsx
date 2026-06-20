"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { type BadgeTitleResult, searchTitlesForBadge } from "../actions";
import { LibraryLinkInput } from "./library-link-input";

/** The `title_completed` slice of BadgeCriterion the picker edits. */
type TitleValue = {
  source: "tmdb" | "anilist";
  sourceId: string;
  mediaKind: "movie" | "tv" | "anime";
  title?: string;
};

/**
 * Picks any title (movie, series or anime) for a `title_completed` badge, which
 * unlocks when the user marks that title as watched. Unlike the season picker
 * this spans both TMDB and anime since every kind tracks a watched status.
 */
export function TitlePicker({
  value,
  onChange,
}: {
  value: TitleValue;
  onChange: (next: TitleValue) => void;
}) {
  const t = useTranslations("admin");
  const [source, setSource] = useState<"tmdb" | "anime">("tmdb");
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
      setResults(await searchTitlesForBadge(q, source));
    });
  }, [debounced, source]);

  const handleSelect = (item: BadgeTitleResult) => {
    setQuery("");
    setResults([]);
    onChange({
      source: item.source,
      sourceId: item.sourceId,
      mediaKind: item.mediaKind,
      title: item.year ? `${item.title} (${item.year})` : item.title,
    });
  };

  const clearSelection = () => {
    onChange({ source: "tmdb", sourceId: "", mediaKind: "movie", title: undefined });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t("condition.titleCompletedHint")}</p>

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
          <div className="flex gap-1.5">
            {(["tmdb", "anime"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={source === s ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSource(s);
                  setResults([]);
                }}
              >
                {t(s === "tmdb" ? "condition.tmdbTab" : "condition.animeTab")}
              </Button>
            ))}
          </div>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("condition.searchAnyTitle")}
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
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-muted",
                    )}
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
          <LibraryLinkInput onResolved={handleSelect} />
        </>
      )}
    </div>
  );
}
