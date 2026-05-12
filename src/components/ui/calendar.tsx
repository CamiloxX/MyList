"use client";

import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Currently-selected date as `YYYY-MM-DD`, or null/undefined for none. */
  value?: string | null;
  /** Fires with `YYYY-MM-DD` when the user picks a day. */
  onSelect: (iso: string) => void;
};

/**
 * Self-contained month-grid calendar built on date-fns. Mirrors the shadcn
 * Calendar look (header with month label + prev/next chevrons, Mon-Sun row,
 * 6×7 day grid with leading/trailing fill from neighbor months) without
 * pulling in react-day-picker — the project's stack is closed.
 *
 * Locale-aware: week starts on Monday in Spanish (`es-ES` convention) and on
 * Sunday in English. Day names come from date-fns so they match the user's
 * active interface language without extra i18n keys.
 */
export function Calendar({ value, onSelect }: Props) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const dfnsLocale = locale === "en" ? enUS : es;

  const selected = useMemo(() => parseIso(value), [value]);
  const today = useMemo(() => stripTime(new Date()), []);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selected ?? today));

  const monthLabel = useMemo(() => {
    const raw = format(viewMonth, "LLLL yyyy", { locale: dfnsLocale });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewMonth, dfnsLocale]);

  const weekDays = useMemo(() => buildWeekdayLabels(dfnsLocale), [dfnsLocale]);
  const days = useMemo(() => buildMonthGrid(viewMonth, dfnsLocale), [viewMonth, dfnsLocale]);

  return (
    <div className="flex flex-col gap-2">
      <header className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setViewMonth((d) => subMonths(d, 1))}
          aria-label={t("prevMonth")}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewMonth((d) => addMonths(d, 1))}
          aria-label={t("nextMonth")}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </button>
      </header>

      <div className="grid grid-cols-7 gap-y-1 px-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {days.map((date) => {
          const inMonth = isSameMonth(date, viewMonth);
          const isToday = isSameDay(date, today);
          const isSelected = selected ? isSameDay(date, selected) : false;
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(format(date, "yyyy-MM-dd"))}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "hover:bg-accent hover:text-foreground",
                isToday && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
              )}
              aria-pressed={isSelected}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>

      <footer className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => onSelect(format(today, "yyyy-MM-dd"))}
          className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {t("today")}
        </button>
      </footer>
    </div>
  );
}

function parseIso(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildWeekdayLabels(dfnsLocale: Locale): string[] {
  const start = startOfWeek(new Date(), { locale: dfnsLocale });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return format(d, "eeeeee", { locale: dfnsLocale });
  });
}

function buildMonthGrid(viewMonth: Date, dfnsLocale: Locale): Date[] {
  const first = startOfWeek(startOfMonth(viewMonth), { locale: dfnsLocale });
  const last = endOfWeek(endOfMonth(viewMonth), { locale: dfnsLocale });
  const days: Date[] = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

type Locale = typeof es;
