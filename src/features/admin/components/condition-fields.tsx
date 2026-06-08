"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BadgeCriterion, BadgeCriterionKind } from "@/features/badges/types";
import { AnimeEpisodesPicker } from "./anime-episodes-picker";
import { SeriesPicker } from "./series-picker";
import { TitlePicker } from "./title-picker";

// Order shown in the kind dropdown: the ones the admin authors first, then the
// progress counters (used by the built-in badges).
const KIND_OPTIONS: BadgeCriterionKind[] = [
  "title_completed",
  "title_season",
  "title_episodes",
  "manual",
  "media_completed_count",
  "watch_entries_count",
  "ratings_count",
  "unique_genres_count",
  "unique_decades_count",
  "same_day_entries",
  "daily_streak",
];

const MEDIA_KINDS = ["movie", "tv", "anime"] as const;

function defaultCriterion(kind: BadgeCriterionKind): BadgeCriterion {
  switch (kind) {
    case "title_season":
      return { kind, source: "tmdb", sourceId: "", mediaKind: "tv", season: 1 };
    case "title_completed":
      return { kind, source: "tmdb", sourceId: "", mediaKind: "movie" };
    case "title_episodes":
      return { kind, source: "anilist", sourceId: "", episodes: 12 };
    case "manual":
      return { kind };
    case "media_completed_count":
      return { kind, mediaKind: "movie", target: 1 };
    default:
      return { kind, target: 1 };
  }
}

/** Does this criterion kind carry a numeric `target`? */
function hasTarget(c: BadgeCriterion): c is Extract<BadgeCriterion, { target: number }> {
  return (
    c.kind !== "manual" &&
    c.kind !== "title_season" &&
    c.kind !== "title_completed" &&
    c.kind !== "title_episodes"
  );
}

export function ConditionFields({
  value,
  onChange,
}: {
  value: BadgeCriterion;
  onChange: (next: BadgeCriterion) => void;
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
      <div className="flex flex-col gap-1.5">
        <Label>{t("condition.label")}</Label>
        <Select
          value={value.kind}
          onValueChange={(v) => {
            if (v) onChange(defaultCriterion(v as BadgeCriterionKind));
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {t(`condition.kinds.${kind}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.kind === "manual" ? (
        <p className="text-xs text-muted-foreground">{t("condition.manualHint")}</p>
      ) : null}

      {value.kind === "title_season" ? (
        <SeriesPicker
          value={value}
          onChange={(next) => onChange({ kind: "title_season", ...next })}
        />
      ) : null}

      {value.kind === "title_completed" ? (
        <TitlePicker
          value={value}
          onChange={(next) => onChange({ kind: "title_completed", ...next })}
        />
      ) : null}

      {value.kind === "title_episodes" ? (
        <AnimeEpisodesPicker
          value={value}
          onChange={(next) => onChange({ kind: "title_episodes", ...next })}
        />
      ) : null}

      {value.kind === "media_completed_count" ? (
        <div className="flex flex-col gap-1.5">
          <Label>{t("condition.mediaKind")}</Label>
          <Select
            value={value.mediaKind}
            onValueChange={(v) => {
              if (v) onChange({ ...value, mediaKind: v as (typeof MEDIA_KINDS)[number] });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`condition.mediaKinds.${k}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {hasTarget(value) ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="criterion-target">{t("condition.target")}</Label>
          <Input
            id="criterion-target"
            type="number"
            min={1}
            value={value.target}
            onChange={(e) =>
              onChange({ ...value, target: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
