"use client";

import { CalendarClockIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Highlighted "next episode" card with a live relative countdown ("Tomorrow",
 * "In 3 days", "In 5 hours"). The absolute date is formatted server-side (in
 * Colombia time); the countdown is computed on the client so it stays fresh and
 * avoids a hydration mismatch — it appears right after mount and re-ticks.
 */
export function NextEpisodeCard({
  airDateIso,
  episodeCode,
  dateLabel,
  timeLabel,
}: {
  airDateIso: string;
  episodeCode: string | null;
  dateLabel: string;
  timeLabel: string | null;
}) {
  const t = useTranslations("library.detail.nextEpisode");
  const format = useFormatter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    // The exact air time matters within the last day; a 1-min tick is plenty.
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(airDateIso).getTime();
  const diff = now == null ? null : target - now;
  // "Soon" = within ~36h, so today/tomorrow episodes glow; otherwise calm blue.
  const isSoon = diff != null && diff <= 1.5 * DAY;
  const isPast = diff != null && diff < 0;

  let countdown: string | null = null;
  if (now != null && diff != null && !isPast) {
    // Pick a sensible unit: hours when under a day, days otherwise.
    countdown = format.relativeTime(new Date(target), {
      now,
      unit: diff < DAY ? "hour" : "day",
    });
    countdown = countdown.charAt(0).toUpperCase() + countdown.slice(1);
  }

  const detail = [episodeCode, [dateLabel, timeLabel].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 ring-1 ring-inset transition-colors",
        isSoon
          ? "border-transparent bg-emerald-500/10 ring-emerald-500/20"
          : "border-transparent bg-sky-500/10 ring-sky-500/20",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          isSoon
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        )}
      >
        <CalendarClockIcon className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {t("label")}
        </span>
        <span className="truncate text-base font-semibold leading-tight">
          {countdown ?? dateLabel}
        </span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  );
}
