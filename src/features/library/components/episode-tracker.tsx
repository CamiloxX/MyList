"use client";

import { CheckCheckIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifyBadges } from "@/features/badges/notify";
import { setEpisodesWatched } from "../actions";

/**
 * Episode-progress tracker for anime (the native model — MyAnimeList splits
 * seasons into separate entries, so there's no per-season toggle like TV). Shows
 * "watched / total" with a progress bar and +/- buttons; "mark complete" jumps
 * to the total. Optimistic like SeasonToggle: the count flips instantly and
 * snaps back on error. When the total is unknown (episode_count is null) it
 * falls back to a free number input.
 */
export function EpisodeTracker({
  mediaItemId,
  total,
  initialWatched,
}: {
  mediaItemId: string;
  total: number | null;
  initialWatched: number;
}) {
  const t = useTranslations("library.episodes");
  const notifyBadges = useNotifyBadges();
  const [optimisticCount, setOptimisticCount] = useOptimistic(initialWatched);
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(String(initialWatched));

  const commit = (count: number) => {
    const clamped = total != null ? Math.min(Math.max(0, count), total) : Math.max(0, count);
    startTransition(async () => {
      setOptimisticCount(clamped);
      const result = await setEpisodesWatched({ mediaItemId, count: clamped });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.newBadges?.length) notifyBadges(result.newBadges);
    });
  };

  // Unknown total: free number input + save (no progress bar — we can't show a
  // ratio without a denominator). Still feeds badges via the same action.
  if (total == null) {
    const onSave = () => {
      const n = Number.parseInt(inputValue, 10);
      if (Number.isNaN(n) || n < 0) {
        toast.error(t("invalid"));
        return;
      }
      commit(n);
    };
    return (
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={inputValue}
            disabled={isPending}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-24"
            aria-label={t("episodesWatchedLabel")}
          />
          <span className="text-sm text-muted-foreground">{t("episodesUnit")}</span>
          <Button type="button" size="sm" className="ml-auto" disabled={isPending} onClick={onSave}>
            {t("save")}
          </Button>
        </div>
      </section>
    );
  }

  const pct = total > 0 ? Math.min(100, (optimisticCount / total) * 100) : 0;
  const atStart = optimisticCount <= 0;
  const atEnd = optimisticCount >= total;

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <span className="text-sm tabular-nums text-muted-foreground">
          {t("progress", { watched: optimisticCount, total })}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={isPending || atStart}
          onClick={() => commit(optimisticCount - 1)}
          aria-label={t("decrement")}
        >
          <MinusIcon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={isPending || atEnd}
          onClick={() => commit(optimisticCount + 1)}
          aria-label={t("increment")}
        >
          <PlusIcon aria-hidden />
        </Button>
        {atEnd ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCheckIcon className="size-4" aria-hidden />
            {t("completed")}
          </span>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ml-auto gap-1.5"
            disabled={isPending}
            onClick={() => commit(total)}
          >
            <CheckCheckIcon className="size-4" aria-hidden />
            {t("markComplete")}
          </Button>
        )}
      </div>
    </section>
  );
}
