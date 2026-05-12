"use client";

import {
  BookmarkIcon,
  CheckCircle2Icon,
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
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

/**
 * Library filters mounted as a single trigger button that opens a bottom-sheet
 * drawer. The drawer pattern works well on both mobile (full-width sheet, swipe
 * to dismiss) and desktop (centered, capped width). Picking a pill closes the
 * sheet automatically — there's nothing else to do once a filter is chosen.
 */
export function LibraryFilters({ counts }: { counts: LibraryFilterCounts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as MediaStatus | null;
  const kind = searchParams.get("kind") as MediaKind | null;
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const activeCount = (status ? 1 : 0) + (kind ? 1 : 0);
  const hasActive = activeCount > 0;

  return (
    <div className="flex items-center gap-2">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 rounded-full px-4",
                hasActive && "border-primary/50 text-primary",
              )}
            />
          }
        >
          <SlidersHorizontalIcon className="size-4" aria-hidden />
          <span>{t("library.filters.title")}</span>
          {hasActive ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {activeCount}
            </span>
          ) : null}
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("library.filters.title")}</DrawerTitle>
            <p className="text-xs text-muted-foreground">
              {t("library.filters.itemTotal", { count: counts.total })}
            </p>
          </DrawerHeader>

          <div className="flex flex-col gap-5 overflow-y-auto pb-2">
            <FilterGroup label={t("library.filters.status")}>
              <FilterPill
                href={buildFilterHref(pathname, searchParams, "status", null)}
                onPick={() => setOpen(false)}
                label={t("library.filters.all")}
                icon={LayersIcon}
                count={counts.total}
                isActive={status === null}
              />
              {STATUS_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref(pathname, searchParams, "status", option.value)}
                  onPick={() => setOpen(false)}
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
                onPick={() => setOpen(false)}
                label={t("library.filters.all")}
                icon={LayersIcon}
                count={counts.total}
                isActive={kind === null}
              />
              {KIND_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref(pathname, searchParams, "kind", option.value)}
                  onPick={() => setOpen(false)}
                  label={t(`kinds.${option.value}` as "kinds.movie")}
                  icon={KIND_ICONS[option.value]}
                  count={counts.byKind[option.value] ?? 0}
                  isActive={kind === option.value}
                />
              ))}
            </FilterGroup>
          </div>

          <DrawerFooter>
            {hasActive ? (
              <Link
                href={pathname}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <XIcon className="size-4" aria-hidden />
                {t("library.filters.clear")}
              </Link>
            ) : (
              <span />
            )}
            <DrawerClose
              render={<Button type="button" size="sm" className="px-5" />}
            >
              {t("library.filters.done")}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
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
  onPick,
}: {
  href: string;
  label: string;
  icon: IconComponent;
  iconClass?: string;
  count: number;
  isActive: boolean;
  onPick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
        isActive
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground active:scale-95",
      )}
    >
      <Icon
        className={cn("size-4 shrink-0", isActive ? "text-primary-foreground" : iconClass)}
        aria-hidden
      />
      <span>{label}</span>
      <span
        className={cn(
          "min-w-[1.5rem] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5",
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
