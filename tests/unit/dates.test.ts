import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentYearMonth,
  formatWatchedOn,
  formatYearMonth,
  parseYearMonth,
  shiftYearMonth,
  todayIso,
  yearMonthRange,
} from "@/lib/dates";

describe("dates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Sat 9 May 2026 12:00 local
    vi.setSystemTime(new Date(2026, 4, 9, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("todayIso", () => {
    it("returns today as YYYY-MM-DD", () => {
      expect(todayIso()).toBe("2026-05-09");
    });
  });

  describe("currentYearMonth", () => {
    it("returns the current YYYY-MM", () => {
      expect(currentYearMonth()).toBe("2026-05");
    });
  });

  describe("parseYearMonth", () => {
    it("parses a valid year-month", () => {
      const result = parseYearMonth("2026-05");
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(4);
    });

    it("returns null for invalid format", () => {
      expect(parseYearMonth("2026/05")).toBeNull();
      expect(parseYearMonth("2026-5")).toBeNull();
      expect(parseYearMonth("not-a-date")).toBeNull();
      expect(parseYearMonth(null)).toBeNull();
      expect(parseYearMonth(undefined)).toBeNull();
      expect(parseYearMonth("")).toBeNull();
    });
  });

  describe("yearMonthRange", () => {
    it("returns first and last+1 day of the month", () => {
      const range = yearMonthRange("2026-05");
      expect(range).toEqual({ start: "2026-05-01", endExclusive: "2026-06-01" });
    });

    it("rolls over December correctly", () => {
      const range = yearMonthRange("2026-12");
      expect(range).toEqual({ start: "2026-12-01", endExclusive: "2027-01-01" });
    });

    it("returns null for invalid input", () => {
      expect(yearMonthRange("garbage")).toBeNull();
    });
  });

  describe("formatYearMonth", () => {
    it("formats in Spanish with capitalized month", () => {
      expect(formatYearMonth("2026-05")).toBe("Mayo 2026");
      expect(formatYearMonth("2026-01")).toBe("Enero 2026");
      expect(formatYearMonth("2026-12")).toBe("Diciembre 2026");
    });

    it("returns input unchanged on invalid value", () => {
      expect(formatYearMonth("not-valid")).toBe("not-valid");
    });
  });

  describe("shiftYearMonth", () => {
    it("shifts forward and backward", () => {
      expect(shiftYearMonth("2026-05", 1)).toBe("2026-06");
      expect(shiftYearMonth("2026-05", -1)).toBe("2026-04");
    });

    it("crosses year boundaries", () => {
      expect(shiftYearMonth("2026-12", 1)).toBe("2027-01");
      expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
    });

    it("handles multi-month shifts", () => {
      expect(shiftYearMonth("2026-05", 12)).toBe("2027-05");
      expect(shiftYearMonth("2026-05", -24)).toBe("2024-05");
    });
  });

  describe("formatWatchedOn", () => {
    it("formats a watched_on date in Spanish", () => {
      const label = formatWatchedOn("2026-05-09");
      // Locale output varies in edge cases; check structural parts.
      expect(label).toMatch(/2026/);
      expect(label).toMatch(/may/i);
      expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
    });

    it("returns the input on invalid value", () => {
      expect(formatWatchedOn("not-a-date")).toBe("not-a-date");
    });
  });
});
