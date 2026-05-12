"use client";

import {
  BookmarkIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  EyeIcon,
  FilmIcon,
  LayersIcon,
  type LucideIcon,
  SlidersHorizontalIcon,
  TvIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnimeIcon } from "@/features/discover/components/media-icons";
import { cn } from "@/lib/utils";
import type { MediaKind, MediaStatus } from "../status";
import { KIND_OPTIONS, STATUS_OPTIONS } from "../status";

type IconComponent = LucideIcon | typeof AnimeIcon;

const STATUS_ICONS: Record<MediaStatus, IconComponent> = {
  watching: EyeIcon,
  watched: CheckCircle2Icon,
  pending: BookmarkIcon,
  dropped: XCircleIcon,
};

const KIND_ICONS: Record<MediaKind, IconComponent> = {
  movie: FilmIcon,
  tv: TvIcon,
  anime: AnimeIcon,
};

/**
 * Per-status accent ring shown when the chip is INACTIVE — gives each status a
 * subtle visual identity without competing with the primary color used for the
 * active state. Active chips drop the ring and switch to solid primary.
 */
const STATUS_ACCENT: Record<MediaStatus, string> = {
  watching: "text-sky-500 dark:text-sky-400",
  watched: "text-emerald-500 dark:text-emerald-400",
  pending: "text-amber-500 dark:text-amber-400",
  dropped: "text-rose-500 dark:text-rose-400",
};

export type LibraryFilterCounts = {
  total: number;
  byStatus: Record<MediaStatus, number>;
  byKind: Record<MediaKind, number>;
};

export function LibraryFilters({ counts }: { counts: LibraryFilterCounts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as MediaStatus | null;
  const kind = searchParams.get("kind") as MediaKind | null;
  const t = useTranslations();

  const activeCount = (status ? 1 : 0) + (kind ? 1 : 0);
  const hasActive = activeCount > 0;
  // Default open when filters are active so the user can see what's applied
  // without having to click; default closed otherwise to keep the page tidy.
  const [isOpen, setIsOpen] = useState(hasActive);

  return (
    <section
      aria-label={t("library.filters.ariaPanel")}
      className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <header className="flex items-center justify-between gap-2 p-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="library-filters-panel"
          className="inline-flex flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:text-foreground"
        >
          <SlidersHorizontalIcon className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">
            {t("library.filters.title")}
          </span>
          {hasActive ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {t("library.filters.activeBadge", { count: activeCount })}
            </span>
          ) : null}
          <ChevronDownIcon
            className={cn(
              "ml-auto size-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {hasActive ? (
          <Link
            href={pathname}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <XIcon className="size-3.5" aria-hidden />
            {t("library.filters.clear")}
          </Link>
        ) : null}
      </header>

      <div
        id="library-filters-panel"
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 border-t p-4">
            <FilterGroup label={t("library.filters.status")}>
              <FilterPill
                href={buildFilterHref(pathname, searchParams, "status", null)}
                label={t("library.filters.all")}
                icon={LayersIcon}
                count={counts.total}
                isActive={status === null}
              />
              {STATUS_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref(pathname, searchParams, "status", option.value)}
                  label={t(`statuses.${option.value}` as "statuses.watching")}
                  icon={STATUS_ICONS[option.value]}
                  iconClass={STATUS_ACCENT[option.value]}
                  count={counts.byStatus[option.value] ?? 0}
                  isActive={status === option.value}
                />
              ))}
            </FilterGroup>

            <FilterGroup label={t("library.filters.kind")}>
              <FilterPill
                href={buildFilterHref(pathname, searchParams, "kind", null)}
                label={t("library.filters.all")}
                icon={LayersIcon}
                count={counts.total}
                isActive={kind === null}
              />
              {KIND_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref(pathname, searchParams, "kind", option.value)}
                  label={t(`kinds.${option.value}` as "kinds.movie")}
                  icon={KIND_ICONS[option.value]}
                  count={counts.byKind[option.value] ?? 0}
                  isActive={kind === option.value}
                />
              ))}
            </FilterGroup>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  icon: Icon,
  iconClass,
  count,
  isActive,
}: {
  href: string;
  label: string;
  icon: IconComponent;
  /** Accent color for the icon when the pill is INACTIVE; ignored when active. */
  iconClass?: string;
  count: number;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        isActive
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon
        className={cn("size-3.5 shrink-0", isActive ? "text-primary-foreground" : iconClass)}
        aria-hidden
      />
      <span>{label}</span>
      <span
        className={cn(
          "min-w-[1.25rem] rounded-full px-1.5 text-center text-[10px] font-semibold tabular-nums leading-4",
          isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function buildFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  param: "status" | "kind",
  value: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (value === null) {
    params.delete(param);
  } else {
    params.set(param, value);
  }
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
