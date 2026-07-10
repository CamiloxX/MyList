"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  /** Retry callback provided by the Next.js error boundary (`reset`). */
  reset: () => void;
  /** Contextual copy overrides; defaults to the generic errors.* strings. */
  title?: string;
  description?: string;
  /** Escape hatch back to the library for boundaries inside the app shell. */
  showHomeLink?: boolean;
};

/**
 * Shared UI for error.tsx boundaries. Mirrors the dashed empty-state look so
 * error and empty screens read as one family.
 */
export function ErrorState({ reset, title, description, showHomeLink = false }: Props) {
  const t = useTranslations("errors");

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
      <AlertTriangleIcon aria-hidden className="size-8 text-muted-foreground" />
      <p className="font-medium">{title ?? t("title")}</p>
      <p className="text-sm text-muted-foreground">{description ?? t("description")}</p>
      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" onClick={reset}>
          {t("retry")}
        </Button>
        {showHomeLink ? (
          <Link href="/library" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {t("goHome")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
