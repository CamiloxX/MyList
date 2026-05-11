"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BadgeWithStatus } from "../types";
import { BadgeCard } from "./badge-card";

type Filter = "all" | "earned" | "inProgress";

const FILTERS: ReadonlyArray<Filter> = ["all", "earned", "inProgress"];

export function BadgesGrid({ items }: { items: BadgeWithStatus[] }) {
  const t = useTranslations("badges");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "earned") return items.filter((b) => b.earnedAt != null);
    if (filter === "inProgress") return items.filter((b) => b.earnedAt == null);
    return items;
  }, [items, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={t("filters.aria")} className="flex gap-1.5">
        {FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
            className={cn("text-xs")}
          >
            {t(`filters.${value}`)}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
          {t("emptyFiltered")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}
