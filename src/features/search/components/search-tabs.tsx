"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TAB_VALUES = ["tmdb", "anime"] as const;
export type SearchType = (typeof TAB_VALUES)[number];

export function SearchTabs({ current }: { current: SearchType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("search.tabs");

  return (
    <div
      role="tablist"
      aria-label={t("aria")}
      className="flex items-center gap-1 rounded-lg border bg-card p-1"
    >
      {TAB_VALUES.map((value) => {
        const isActive = current === value;
        const params = new URLSearchParams(searchParams.toString());
        if (value === "tmdb") {
          params.delete("type");
        } else {
          params.set("type", value);
        }
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
