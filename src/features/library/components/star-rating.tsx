"use client";

import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STAR_COUNT = 5;
const MAX_VALUE = STAR_COUNT * 2;

type StarRatingProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
};

const SIZE_CLASS = {
  sm: "size-5",
  md: "size-7",
  lg: "size-8",
} as const;

export function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
  ariaLabel,
}: StarRatingProps) {
  const t = useTranslations("library.starRating");
  const [hovered, setHovered] = useState<number | null>(null);
  const current = hovered ?? value ?? 0;
  const sizeClass = SIZE_CLASS[size];
  const groupLabel = ariaLabel ?? t("ariaLabel");

  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className={cn("flex items-center gap-1", disabled && "opacity-50")}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starIndex = index + 1;
        const fullThreshold = starIndex * 2;
        const halfThreshold = fullThreshold - 1;
        const isFull = current >= fullThreshold;
        const isHalf = !isFull && current >= halfThreshold;

        return (
          <div key={starIndex} className={cn("relative", sizeClass)}>
            <StarIcon
              className={cn(sizeClass, "stroke-muted-foreground/40 fill-transparent")}
              aria-hidden
            />
            {(isHalf || isFull) && (
              <div
                className={cn("absolute inset-0 overflow-hidden", isHalf && "w-1/2")}
                aria-hidden
              >
                <StarIcon className={cn(sizeClass, "fill-amber-400 stroke-amber-500")} />
              </div>
            )}

            {!disabled && (
              <>
                <label className="absolute inset-y-0 left-0 w-1/2 cursor-pointer">
                  <span className="sr-only">{t("stars", { value: halfThreshold / 2 })}</span>
                  <input
                    type="radio"
                    name={groupLabel}
                    value={halfThreshold}
                    checked={value === halfThreshold}
                    onChange={() => onChange(halfThreshold)}
                    onMouseEnter={() => setHovered(halfThreshold)}
                    onClick={(event) => {
                      if (value === halfThreshold) {
                        event.preventDefault();
                        onChange(null);
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <label className="absolute inset-y-0 right-0 w-1/2 cursor-pointer">
                  <span className="sr-only">{t("stars", { value: fullThreshold / 2 })}</span>
                  <input
                    type="radio"
                    name={groupLabel}
                    value={fullThreshold}
                    checked={value === fullThreshold}
                    onChange={() => onChange(fullThreshold)}
                    onMouseEnter={() => setHovered(fullThreshold)}
                    onClick={(event) => {
                      if (value === fullThreshold) {
                        event.preventDefault();
                        onChange(null);
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              </>
            )}
          </div>
        );
      })}

      <span className="ml-2 text-sm tabular-nums text-muted-foreground">
        {value ? t("value", { value: value / 2, max: STAR_COUNT }) : t("unrated")}
      </span>

      {!disabled && value !== null && value !== undefined ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("clear")}
        </button>
      ) : null}
    </div>
  );
}

export function StarRatingReadonly({
  value,
  size = "sm",
}: {
  value: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("library.starRating");
  if (!value) return null;
  const sizeClass = SIZE_CLASS[size];

  return (
    <div
      role="img"
      aria-label={t("readonlyAriaLabel", { value: value / 2, max: STAR_COUNT })}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starIndex = index + 1;
        const fullThreshold = starIndex * 2;
        const halfThreshold = fullThreshold - 1;
        const isFull = value >= fullThreshold;
        const isHalf = !isFull && value >= halfThreshold;

        return (
          <div key={starIndex} className={cn("relative", sizeClass)}>
            <StarIcon
              className={cn(sizeClass, "stroke-muted-foreground/40 fill-transparent")}
              aria-hidden
            />
            {(isHalf || isFull) && (
              <div
                className={cn("absolute inset-0 overflow-hidden", isHalf && "w-1/2")}
                aria-hidden
              >
                <StarIcon className={cn(sizeClass, "fill-amber-400 stroke-amber-500")} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { MAX_VALUE as STAR_RATING_MAX };
