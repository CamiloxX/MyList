import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { BadgeTier, BadgeWithStatus } from "../types";
import { BadgeIcon } from "./badge-icon";

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
  silver: "from-slate-400/20 to-slate-400/5 text-slate-600 dark:text-slate-300",
  gold: "from-yellow-400/30 to-yellow-400/5 text-yellow-600 dark:text-yellow-400",
};

export function BadgeCard({ badge }: { badge: BadgeWithStatus }) {
  const t = useTranslations("badges");
  const format = useFormatter();
  const earned = badge.earnedAt != null;
  const pct = Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100));

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-opacity",
        !earned && "opacity-70 hover:opacity-100",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
            TIER_STYLES[badge.tier],
            !earned && "grayscale",
          )}
        >
          <BadgeIcon iconKey={badge.iconKey} className="size-6" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="font-medium leading-tight">
            {t(`items.${badge.i18nKey}.name`)}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`items.${badge.i18nKey}.description`)}
          </p>
        </div>
      </div>

      {earned ? (
        <p className="text-xs text-muted-foreground">
          {t("earnedOn", {
            date: format.dateTime(new Date(badge.earnedAt as string), {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          })}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("progress", {
              current: badge.progress.current,
              target: badge.progress.target,
            })}
          </p>
        </div>
      )}
    </article>
  );
}
