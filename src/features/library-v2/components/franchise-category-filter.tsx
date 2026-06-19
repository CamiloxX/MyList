"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Section = { key: string; label: string; node: ReactNode };

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
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab.key === active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
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
