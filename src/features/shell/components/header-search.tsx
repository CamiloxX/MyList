"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * Pressing Enter or clicking the lupa submits the form and navigates to
 * /search?type=...&q=... When the user is already on /search, the bar
 * prefills from the URL so it mirrors the current results.
 *
 * Hidden on mobile (`hidden md:flex`); on mobile the bottom-nav search icon
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push({
      pathname: "/search",
      query:
        type === "anime"
          ? trimmed
            ? { q: trimmed, type: "anime" }
            : { type: "anime" }
          : trimmed
            ? { q: trimmed }
            : {},
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label={t("search.title")}
      className="hidden w-full max-w-md md:block"
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
          aria-label={t("search.title")}
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
    </form>
  );
}
