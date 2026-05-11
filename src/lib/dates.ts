import { format, parse } from "date-fns";
import { enUS, es } from "date-fns/locale";

type SupportedLocale = "es" | "en";

function dfnsLocale(locale: SupportedLocale | string | undefined) {
  return locale === "en" ? enUS : es;
}

/** Today as `YYYY-MM-DD` in the local timezone. */
export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Current year-month as `YYYY-MM`. */
export function currentYearMonth(): string {
  return format(new Date(), "yyyy-MM");
}

/** Validate and parse a `YYYY-MM` string, returning null if invalid. */
export function parseYearMonth(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  try {
    const parsed = parse(`${value}-01`, "yyyy-MM-dd", new Date());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/** Get the first day (inclusive) and last day (exclusive) of a year-month. */
export function yearMonthRange(value: string): { start: string; endExclusive: string } | null {
  const date = parseYearMonth(value);
  if (!date) return null;
  const start = format(date, "yyyy-MM-dd");
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const endExclusive = format(next, "yyyy-MM-dd");
  return { start, endExclusive };
}

/** Pretty month label localized, e.g. "Mayo 2026" / "May 2026". */
export function formatYearMonth(value: string, locale?: string): string {
  const date = parseYearMonth(value);
  if (!date) return value;
  const label = format(date, "MMMM yyyy", { locale: dfnsLocale(locale) });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Shift a year-month by N months (positive or negative). */
export function shiftYearMonth(value: string, deltaMonths: number): string {
  const date = parseYearMonth(value);
  if (!date) return value;
  const next = new Date(date.getFullYear(), date.getMonth() + deltaMonths, 1);
  return format(next, "yyyy-MM");
}

/** Format a `YYYY-MM-DD` watched_on date, localized per locale. */
export function formatWatchedOn(value: string, locale?: string): string {
  try {
    const date = parse(value, "yyyy-MM-dd", new Date());
    if (Number.isNaN(date.getTime())) return value;
    const pattern = locale === "en" ? "EEE MMM d yyyy" : "EEE d 'de' MMM yyyy";
    const label = format(date, pattern, { locale: dfnsLocale(locale) });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return value;
  }
}

/** Current year as a 4-digit string, e.g. "2026". */
export function currentYear(): string {
  return format(new Date(), "yyyy");
}

/** Validate a year string (must be a 4-digit integer between 1900 and 2200). */
export function parseYear(value: string | undefined | null): number | null {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number.parseInt(value, 10);
  if (year < 1900 || year > 2200) return null;
  return year;
}

/** First day (inclusive) and last day (exclusive) of a year as ISO dates. */
export function yearRange(year: number): { start: string; endExclusive: string } {
  return {
    start: `${year}-01-01`,
    endExclusive: `${year + 1}-01-01`,
  };
}

/** Localized full month label by index 0-11. */
export function monthNameByIndex(index: number, locale?: string): string {
  const date = new Date(2000, index, 1);
  const label = format(date, "MMMM", { locale: dfnsLocale(locale) });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
