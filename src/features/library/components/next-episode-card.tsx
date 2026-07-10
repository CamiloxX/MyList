"use client";

import { CalendarClockIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Floating "next episode" pill overlaid on the poster, with a live relative
 * countdown ("Tomorrow", "In 3 days", "In 5 hours"). The absolute date is
 * formatted server-side (Colombia time); the countdown is computed client-side
 * so it stays fresh and avoids a hydration mismatch — the date shows during SSR
 * and the countdown takes over after mount.
 *
 * Designed to sit inside a `relative` poster container.
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
      className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-1.5 backdrop-blur-sm"
      title={t("label")}
    >
      <CalendarClockIcon
        className={cn("size-4 shrink-0", isSoon ? "text-emerald-400" : "text-sky-400")}
        aria-hidden
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-semibold text-white">{countdown ?? dateLabel}</span>
        <span className="truncate text-[0.65rem] text-white/70">{detail}</span>
      </div>
    </div>
  );
}
