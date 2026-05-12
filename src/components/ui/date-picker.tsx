"use client";

import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatWatchedOn } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = {
  /** Selected ISO date string `YYYY-MM-DD`, or empty string for none. */
  value: string;
  /** Fires whenever the user picks a day; closes the popover automatically. */
  onChange: (value: string) => void;
  id?: string;
  ariaInvalid?: boolean;
  className?: string;
};

/**
 * Replaces a `<input type="date">` with a custom popover + calendar that looks
 * the same in every browser, on desktop and mobile. The trigger button shows
 * the formatted date (or a placeholder) and the popover hosts the Calendar
 * grid. Picking a day calls onChange and dismisses the popover.
 */
export function DatePicker({ value, onChange, id, ariaInvalid, className }: Props) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("calendar");
  const label = value ? formatWatchedOn(value, locale) : t("placeholder");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            className={cn(
              "w-fit min-w-[14rem] justify-start gap-2 font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          value={value || null}
          onSelect={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
