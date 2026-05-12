"use client";

import { ChevronDownIcon, TvIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps the seasons list in a header-only-when-closed panel that mirrors the
 * library filters card: tap "Temporadas (N)" to slide the rows in/out. Server
 * component owns the data; this client wrapper just owns the open/closed flag.
 */
export function SeasonsCollapsible({
  total,
  defaultOpen = false,
  children,
}: {
  total: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("library.seasons");
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      aria-label={t("ariaPanel")}
      className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="seasons-panel"
        className="flex items-center gap-2 p-3 text-left transition-colors hover:text-foreground"
      >
        <TvIcon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">{t("title")}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {total}
        </span>
        <ChevronDownIcon
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        id="seasons-panel"
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t p-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
