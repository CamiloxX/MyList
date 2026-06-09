"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { key: string; label: string; node: ReactNode };

/**
 * Client toggle between the available watch orders (chronological / release /
 * story). All order lists are server-rendered and passed in as `node`s; this
 * just shows the active one so switching is instant (no refetch).
 */
export function WatchOrderTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 self-start rounded-lg border bg-card p-1">
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
      {tabs.map((tab) => (
        <div key={tab.key} className={tab.key === active ? "block" : "hidden"}>
          {tab.node}
        </div>
      ))}
    </div>
  );
}
