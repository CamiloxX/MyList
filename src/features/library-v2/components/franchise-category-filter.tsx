"use client";

import { FilmIcon, LayoutGridIcon, type LucideIcon, SparklesIcon, TvIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Section = { key: string; label: string; node: ReactNode };

/** One icon per category, shown on the filter chip. Keyed by the section key. */
const ICONS: Record<string, LucideIcon> = {
  all: LayoutGridIcon,
  movie: FilmIcon,
  tv: TvIcon,
  anime: SparklesIcon,
};

/**
 * Client category filter for the watch-order index (Movies / Series / Anime).
 * The per-category sections are server-rendered and passed in as `node`s; this
 * just toggles which are shown (default: all), so filtering is instant with no
 * refetch. Mirrors WatchOrderTabs.
 */
export function FranchiseCategoryFilter({
  sections,
  allLabel,
}: {
  sections: Section[];
  allLabel: string;
}) {
  const [active, setActive] = useState<string>("all");
  const tabs = [{ key: "all", label: allLabel }, ...sections];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-1 self-start rounded-lg border bg-card p-1">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab.key === active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" aria-hidden /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>
      {sections.map((section) => (
        <div
          key={section.key}
          className={active === "all" || active === section.key ? "block" : "hidden"}
        >
          {section.node}
        </div>
      ))}
    </div>
  );
}
