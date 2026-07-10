"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  /**
   * Whether there is a next page. Computed by the server based on the result
   * count: TMDB and Jikan return up to 20-25 items per page; if we got the
   * full page, we assume there is more.
   */
  hasMore: boolean;
};

/**
 * Stateless prev/next pagination. The server reads `?page=N` from search
 * params, so navigation is just a Link to the same path with the new page.
 */
export function PaginationControls({ page, hasMore }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.pagination");

  const buildHref = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(target));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const canGoBack = page > 1;
  const canGoForward = hasMore;
  if (!canGoBack && !canGoForward) return null;

  return (
    <nav aria-label={t("aria")} className="flex items-center justify-between gap-3 pt-2">
      {canGoBack ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          {t("previous")}
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          <ChevronLeftIcon className="size-4" aria-hidden />
          {t("previous")}
        </Button>
      )}
      <span className="text-xs text-muted-foreground">{t("page", { page })}</span>
      {canGoForward ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
        >
          {t("next")}
          <ChevronRightIcon className="size-4" aria-hidden />
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          {t("next")}
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
      )}
    </nav>
  );
}
