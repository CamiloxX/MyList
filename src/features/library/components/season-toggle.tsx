"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useNotifyBadges } from "@/features/badges/notify";
import { cn } from "@/lib/utils";
import { markSeasonWatched, unmarkSeasonWatched } from "../actions";

/**
 * Per-season toggle button rendered inside SeasonsList. Uses useOptimistic so
 * the checkmark flips instantly when clicked; if the server action fails the
 * UI snaps back and a toast surfaces the error.
 */
export function SeasonToggle({
  mediaItemId,
  seasonNumber,
  initialWatched,
}: {
  mediaItemId: string;
  seasonNumber: number;
  initialWatched: boolean;
}) {
  const t = useTranslations("library.seasons");
  const notifyBadges = useNotifyBadges();
  const [optimisticWatched, setOptimisticWatched] = useOptimistic(initialWatched);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const next = !optimisticWatched;
    startTransition(async () => {
      setOptimisticWatched(next);
      const result = next
        ? await markSeasonWatched({ mediaItemId, seasonNumber })
        : await unmarkSeasonWatched({ mediaItemId, seasonNumber });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.newBadges?.length) notifyBadges(result.newBadges);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimisticWatched}
      aria-label={optimisticWatched ? t("unmarkWatched") : t("markWatched")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        optimisticWatched
          ? "border-transparent bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
        isPending && "opacity-70",
      )}
    >
      {optimisticWatched ? (
        <CheckIcon className="size-3.5" aria-hidden />
      ) : (
        <PlusIcon className="size-3.5" aria-hidden />
      )}
      <span>{optimisticWatched ? t("watched") : t("markWatched")}</span>
    </button>
  );
}
