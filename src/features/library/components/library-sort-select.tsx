"use client";

import {
  ArrowDownAZIcon,
  ArrowDownIcon,
  ArrowUpAZIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { LIBRARY_SORT_OPTIONS, type LibrarySort } from "../sort";

const SORT_ICONS: Record<LibrarySort, LucideIcon> = {
  recent: CalendarIcon,
  "title-asc": ArrowDownAZIcon,
  "title-desc": ArrowUpAZIcon,
  "year-desc": ArrowDownIcon,
  "year-asc": ArrowUpIcon,
};

/**
 * Sort picker — mirrors LibraryFilters' drawer pattern so the two controls
 * feel like siblings. The current sort is encoded in ?sort= in the URL.
 */
export function LibrarySortSelect({ current }: { current: LibrarySort }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("library.sort");
  const [open, setOpen] = useState(false);

  const CurrentIcon = SORT_ICONS[current];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-2 rounded-full px-4" />
        }
      >
        <CurrentIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">{t("label")}:</span>
        <span className="font-medium">{t(`options.${current}`)}</span>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>
        <ul className="flex flex-col gap-1 pb-2">
          {LIBRARY_SORT_OPTIONS.map((option) => {
            const Icon = SORT_ICONS[option];
            const isActive = option === current;
            return (
              <li key={option}>
                <Link
                  href={buildSortHref(pathname, searchParams, option)}
                  onClick={() => setOpen(false)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent active:bg-accent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium">{t(`options.${option}`)}</span>
                  {isActive ? <CheckIcon className="size-4 text-primary" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}

function buildSortHref(
  pathname: string,
  searchParams: URLSearchParams,
  sort: LibrarySort,
): string {
  const params = new URLSearchParams(searchParams.toString());
  // Drop the default sort from the URL to keep it clean.
  if (sort === "recent") {
    params.delete("sort");
  } else {
    params.set("sort", sort);
  }
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
