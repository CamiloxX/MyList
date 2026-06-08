"use client";

import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { RATINGS_COOKIE } from "../ratings-prefs";

/**
 * Global toggle for the cover ratings. Writes a year-long cookie and refreshes
 * the server components so every poster picks up the new preference. Optimistic:
 * the button flips immediately while the refresh streams in.
 */
export function RatingsToggle({ initialOn }: { initialOn: boolean }) {
  const t = useTranslations("libraryV2");
  const router = useRouter();
  const [on, setOn] = useState(initialOn);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    // biome-ignore lint/suspicious/noDocumentCookie: a simple, non-sensitive UI preference cookie read back by server components.
    document.cookie = `${RATINGS_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      disabled={isPending}
      title={t("ratingsToggle")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        on
          ? "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <StarIcon className={cn("size-4", on && "fill-current")} aria-hidden />
      <span className="hidden lg:inline">{t("ratingsToggle")}</span>
    </button>
  );
}
