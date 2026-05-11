"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DISCOVER_TABS, type DiscoverTab } from "../schemas";

export function DiscoverTabs({ current }: { current: DiscoverTab }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.tabs");

  return (
    <div
      role="tablist"
      aria-label={t("aria")}
      className="flex items-center gap-1 rounded-lg border bg-card p-1"
    >
      {DISCOVER_TABS.map((value) => {
        const isActive = current === value;
        const params = new URLSearchParams(searchParams.toString());
        if (value === "trending") {
          params.delete("tab");
        } else {
          params.set("tab", value);
        }
        // Drop genre when leaving the genre tab — it makes no sense elsewhere.
        if (value !== "genre") params.delete("genre");
        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        return (
          <Link
            key={value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(value)}
          </Link>
        );
      })}
    </div>
  );
}
