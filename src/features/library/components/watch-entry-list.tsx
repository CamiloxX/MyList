"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWatchedOn } from "@/lib/dates";
import { removeWatchEntry } from "../actions";
import { PlatformIcon } from "./platform-icon";
import { StarRatingReadonly } from "./star-rating";

export type WatchEntryRow = {
  id: string;
  watched_on: string;
  rating: number | null;
  platform: string | null;
  notes: string | null;
  season_number: number | null;
};

export function WatchEntryList({
  entries,
  mediaItemId,
}: {
  entries: WatchEntryRow[];
  mediaItemId: string;
}) {
  const t = useTranslations("library.detail");
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("emptyHistory")}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <WatchEntryRow entry={entry} mediaItemId={mediaItemId} />
        </li>
      ))}
    </ul>
  );
}

function WatchEntryRow({ entry, mediaItemId }: { entry: WatchEntryRow; mediaItemId: string }) {
  const tWatch = useTranslations("library.watchEntry");
  const tRemove = useTranslations("library.remove");
  const tPlatforms = useTranslations("platforms");
  const tSeasons = useTranslations("library.seasons");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeWatchEntry(entry.id, mediaItemId);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(tWatch("removedToast"));
      }
    });
  };

  const platformLabel = entry.platform ? translateKnownPlatform(entry.platform, tPlatforms) : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{formatWatchedOn(entry.watched_on, locale)}</span>
          {entry.rating ? <StarRatingReadonly value={entry.rating} size="sm" /> : null}
          {entry.season_number !== null ? (
            <Badge
              variant="outline"
              className="border-emerald-400/50 text-emerald-600 dark:text-emerald-400"
            >
              {tSeasons("seasonBadge", { number: entry.season_number })}
            </Badge>
          ) : null}
          {entry.platform && platformLabel ? (
            <Badge variant="secondary" className="gap-1.5">
              <PlatformIcon platform={entry.platform} size="sm" />
              {platformLabel}
            </Badge>
          ) : null}
        </div>
        {entry.notes ? <p className="text-sm text-muted-foreground">{entry.notes}</p> : null}
      </div>
      <Button
        variant="ghost"
        size="xs"
        onClick={handleRemove}
        disabled={isPending}
        className="self-end text-muted-foreground hover:text-destructive sm:self-auto"
      >
        {tRemove("button")}
      </Button>
    </div>
  );
}

const KNOWN_PLATFORMS = new Set([
  "Netflix",
  "Prime Video",
  "Disney+",
  "HBO Max",
  "Apple TV+",
  "Crunchyroll",
  "YouTube",
  "Cine",
  "Otra",
]);

function translateKnownPlatform(
  platform: string,
  t: ReturnType<typeof useTranslations<"platforms">>,
): string {
  return KNOWN_PLATFORMS.has(platform) ? t(platform as "Netflix") : platform;
}
