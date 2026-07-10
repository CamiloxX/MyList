"use client";

import { GlobeIcon, MonitorPlayIcon, SlidersHorizontalIcon, TagsIcon, XIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { DiscoverGenre, DiscoverProvider } from "../queries";
import { DEFAULT_REGION, DISCOVER_REGIONS, type DiscoverRegion } from "../schemas";

type Props = {
  showGenre: boolean;
  showStreaming: boolean;
  genres: DiscoverGenre[];
  providers: DiscoverProvider[];
  currentGenre: number | undefined;
  currentRegion: DiscoverRegion;
  currentProvider: number | undefined;
};

/**
 * Unified Discover filters trigger + bottom-sheet. Replaces the row of native
 * `<select>` dropdowns (genre / region / provider) with a single round button
 * that opens a swipeable sheet on mobile and a centered modal on desktop. Each
 * group renders as horizontal pills so values are tappable.
 *
 * URL searchParams are still the source of truth — picking a pill navigates to
 * the new URL via Link, which lets the SSR page re-render with the new filter
 * applied. Pagination is always reset on any filter change.
 */
export function DiscoverFilters({
  showGenre,
  showStreaming,
  genres,
  providers,
  currentGenre,
  currentRegion,
  currentProvider,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.filters");

  const activeCount =
    (currentGenre !== undefined ? 1 : 0) +
    (currentProvider !== undefined ? 1 : 0) +
    (currentRegion !== DEFAULT_REGION ? 1 : 0);
  const hasActive = activeCount > 0;

  const buildHref = (overrides: Record<string, string | null>): string => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Clearing wipes genre/provider explicitly and drops the region param so the
  // schema falls back to DEFAULT_REGION on the next render.
  const clearHref = buildHref({ genre: null, provider: null, region: null });

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-2 rounded-full px-4", hasActive && "border-primary/50 text-primary")}
          />
        }
      >
        <SlidersHorizontalIcon className="size-4" aria-hidden />
        <span>{t("title")}</span>
        {hasActive ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
            {activeCount}
          </span>
        ) : null}
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto pb-2">
          {showGenre ? (
            <FilterSection icon={TagsIcon} label={t("genre")}>
              <PillLink
                href={buildHref({ genre: null })}
                active={currentGenre === undefined}
                onPick={() => setOpen(false)}
              >
                {t("anyGenre")}
              </PillLink>
              {genres.map((genre) => (
                <PillLink
                  key={genre.id}
                  href={buildHref({ genre: String(genre.id) })}
                  active={currentGenre === genre.id}
                  onPick={() => setOpen(false)}
                >
                  {genre.name}
                </PillLink>
              ))}
            </FilterSection>
          ) : null}

          {showStreaming ? (
            <FilterSection icon={GlobeIcon} label={t("region")}>
              {DISCOVER_REGIONS.map((code) => (
                <PillLink
                  key={code}
                  href={buildHref({ region: code, provider: null })}
                  active={currentRegion === code}
                  onPick={() => setOpen(false)}
                >
                  {t(`regions.${code}`)}
                </PillLink>
              ))}
            </FilterSection>
          ) : null}

          {showStreaming ? (
            <FilterSection icon={MonitorPlayIcon} label={t("provider")}>
              <PillLink
                href={buildHref({ provider: null })}
                active={currentProvider === undefined}
                onPick={() => setOpen(false)}
              >
                {t("anyProvider")}
              </PillLink>
              {providers.map((provider) => (
                <PillLink
                  key={provider.id}
                  href={buildHref({ provider: String(provider.id) })}
                  active={currentProvider === provider.id}
                  onPick={() => setOpen(false)}
                >
                  {provider.name}
                </PillLink>
              ))}
            </FilterSection>
          ) : null}
        </div>

        <DrawerFooter>
          {hasActive ? (
            <Link
              href={clearHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <XIcon className="size-4" aria-hidden />
              {t("clear")}
            </Link>
          ) : (
            <span />
          )}
          <DrawerClose render={<Button type="button" size="sm" className="px-5" />}>
            {t("done")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterSection({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof TagsIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PillLink({
  href,
  active,
  children,
  onPick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onPick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground active:scale-95",
      )}
    >
      {children}
    </Link>
  );
}
