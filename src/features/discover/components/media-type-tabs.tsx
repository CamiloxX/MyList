"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DISCOVER_TYPES, type DiscoverType } from "../schemas";

export function MediaTypeTabs({ current }: { current: DiscoverType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.types");

  return (
    <div
      role="tablist"
      aria-label={t("aria")}
      className="flex items-center gap-1 rounded-lg border bg-card p-1"
    >
      {DISCOVER_TYPES.map((value) => {
        const isActive = current === value;
        const params = new URLSearchParams(searchParams.toString());
        if (value === "movie") {
          params.delete("type");
        } else {
          params.set("type", value);
        }
        // Switching media type invalidates the chosen genre.
        params.delete("genre");
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
