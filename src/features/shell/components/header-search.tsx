"use client";

import { SearchIcon } from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SearchSuggestion, searchSuggestions } from "@/features/search/actions";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SEARCH_TYPES = ["tmdb", "anime"] as const;
type SearchType = (typeof SEARCH_TYPES)[number];

/**
 * Always-visible search bar mounted in the app header.
 *
 * Layout: one bordered shell containing
 *   [ category select │ text input │ submit lupa button ]
 *
 * As the user types it shows a typeahead dropdown of matching titles (debounced
 * server lookup). Selecting one — or pressing Enter / the lupa — navigates to
 * /search?type=...&q=... Prefills from the URL when already on /search.
 *
 * Hidden on mobile (`hidden md:block`); on mobile the bottom-nav search icon
 * takes over.
 */
export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const isOnSearchPage = pathname.endsWith("/search");
  const [type, setType] = useState<SearchType>(
    isOnSearchPage && searchParams.get("type") === "anime" ? "anime" : "tmdb",
  );
  const [query, setQuery] = useState(isOnSearchPage ? (searchParams.get("q") ?? "") : "");

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 2 && suggestions.length > 0;

  // Debounced typeahead: fetch suggestions ~300ms after the user stops typing.
  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      startTransition(async () => {
        const res = await searchSuggestions(trimmed, type);
        if (!cancelled) {
          setSuggestions(res);
          setActiveIndex(-1);
        }
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [trimmed, type]);

  const goToSearch = (q: string) => {
    const value = q.trim();
    router.push({
      pathname: "/search",
      query:
        type === "anime"
          ? value
            ? { q: value, type: "anime" }
            : { type: "anime" }
          : value
            ? { q: value }
            : {},
    });
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setOpen(false);
    goToSearch(suggestion.title);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
    goToSearch(query);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (event.key === "Enter") {
      const picked = suggestions[activeIndex];
      if (picked) {
        event.preventDefault();
        selectSuggestion(picked);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label={t("search.title")}
      className="relative hidden w-full max-w-md md:block"
    >
      <div
        className={cn(
          "flex h-9 items-center overflow-hidden rounded-full border bg-background shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        )}
      >
        <Select
          value={type}
          onValueChange={(value: SearchType | null) => {
            if (value) setType(value);
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label={t("search.tabs.aria")}
            className={cn(
              "h-full w-[130px] shrink-0 rounded-none border-0 border-r bg-transparent pl-3 pr-2 shadow-none",
              "focus-visible:border-r-border focus-visible:ring-0",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tmdb">{t("search.tabs.tmdb")}</SelectItem>
            <SelectItem value="anime">{t("search.tabs.anime")}</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="search"
          name="q"
          placeholder={t("search.headerPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a suggestion registers before we close.
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          aria-label={t("search.title")}
          autoComplete="off"
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground",
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={t("search.title")}
          className="h-full w-9 shrink-0 rounded-none rounded-r-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <SearchIcon aria-hidden className="size-4" />
        </Button>
      </div>

      {showDropdown ? (
        <ul className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border bg-popover p-1.5 shadow-lg ring-1 ring-foreground/10">
          {suggestions.map((s, index) => (
            <li key={s.key}>
              <button
                type="button"
                // Keep focus on the input so onBlur doesn't fire before the click.
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(s)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                  index === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                  {s.posterUrl ? (
                    <Image src={s.posterUrl} alt="" fill sizes="32px" className="object-cover" />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`kinds.${s.kind}`)}
                    {s.year ? ` · ${s.year}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
