"use client";

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { currentYearMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

const MONTH_KEYS = [
  "shortJan",
  "shortFeb",
  "shortMar",
  "shortApr",
  "shortMay",
  "shortJun",
  "shortJul",
  "shortAug",
  "shortSep",
  "shortOct",
  "shortNov",
  "shortDec",
] as const;

const YEARS_PAGE_SIZE = 12;

type View = "months" | "years";

export function MonthPickerButton({ current }: { current: string }) {
  const router = useRouter();
  const t = useTranslations("month.picker");
  const tMonths = useTranslations("months");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("months");

  const [initialYear, initialMonth] = current.split("-").map(Number) as [number, number];
  const [year, setYear] = useState(initialYear);
  const [yearsPageStart, setYearsPageStart] = useState(yearsPageStartFor(initialYear));

  const today = currentYearMonth();
  const [todayYear, todayMonth] = today.split("-").map(Number) as [number, number];

  const navigateTo = (targetYear: number, targetMonth: number) => {
    const ym = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    setOpen(false);
    router.push({ pathname: "/month", query: { ym } });
  };

  const openMonthsViewForYear = (targetYear: number) => {
    setYear(targetYear);
    setView("months");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setYear(initialYear);
          setYearsPageStart(yearsPageStartFor(initialYear));
          setView("months");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <CalendarDaysIcon />
            {t("trigger")}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{view === "months" ? t("pickMonth") : t("pickYear")}</DialogTitle>
        </DialogHeader>

        {view === "months" ? (
          <>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setYear((y) => y - 1)}
                aria-label={t("prevYear")}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setYearsPageStart(yearsPageStartFor(year));
                  setView("years");
                }}
                className="text-lg font-semibold tabular-nums"
              >
                {year}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setYear((y) => y + 1)}
                aria-label={t("nextYear")}
              >
                <ChevronRightIcon />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_KEYS.map((key, index) => {
                const monthIndex = index + 1;
                const isSelected = year === initialYear && monthIndex === initialMonth;
                const isToday = year === todayYear && monthIndex === todayMonth;
                return (
                  <Button
                    key={key}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => navigateTo(year, monthIndex)}
                    className={cn("h-10", !isSelected && isToday && "ring-1 ring-primary/40")}
                  >
                    {tMonths(key)}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo(todayYear, todayMonth)}
              className="self-center text-muted-foreground"
            >
              {t("goToCurrentMonth")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setYearsPageStart((s) => s - YEARS_PAGE_SIZE)}
                aria-label={t("prevPage")}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {yearsPageStart} – {yearsPageStart + YEARS_PAGE_SIZE - 1}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setYearsPageStart((s) => s + YEARS_PAGE_SIZE)}
                aria-label={t("nextPage")}
              >
                <ChevronRightIcon />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: YEARS_PAGE_SIZE }, (_, index) => {
                const value = yearsPageStart + index;
                const isSelected = value === initialYear;
                const isCurrentYear = value === todayYear;
                return (
                  <Button
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => openMonthsViewForYear(value)}
                    className={cn(
                      "h-10 tabular-nums",
                      !isSelected && isCurrentYear && "ring-1 ring-primary/40",
                    )}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setYearsPageStart(yearsPageStartFor(todayYear));
                openMonthsViewForYear(todayYear);
              }}
              className="self-center text-muted-foreground"
            >
              {t("goToCurrentYear")}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function yearsPageStartFor(year: number): number {
  return year - (((year % YEARS_PAGE_SIZE) + YEARS_PAGE_SIZE) % YEARS_PAGE_SIZE);
}
