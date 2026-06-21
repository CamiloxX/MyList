import { CheckIcon, TrophyIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import type { BadgeTier, BadgeWithStatus } from "@/features/badges/types";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
  silver: "from-slate-400/20 to-slate-400/5 text-slate-600 dark:text-slate-300",
  gold: "from-yellow-400/30 to-yellow-400/5 text-yellow-600 dark:text-yellow-400",
};

/**
 * "Achievements for this title" box on the library detail page: the badges whose
 * unlock is tied to THIS title (completed / season / episode-count criteria),
 * each with the user's state — unlocked (check) or in progress (a bar for the
 * episode-count ones). Renders nothing when no badge targets this title, so it
 * only shows up where it's relevant. Matches the other right-column cards.
 */
export async function TitleBadgesCard({ badges }: { badges: BadgeWithStatus[] }) {
  if (badges.length === 0) return null;
  const t = await getTranslations("libraryV2.detail");
  const earnedCount = badges.filter((badge) => badge.earnedAt != null).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
      {/* Warm corner glow so the achievements card stands out from the neutral
          details/providers cards and nudges the user to chase the badges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-amber-400/15 blur-2xl"
      />
      <div className="relative mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-sm shadow-amber-500/30">
          <TrophyIcon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{t("achievements")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("achievementsCount", { earned: earnedCount, total: badges.length })}
          </p>
        </div>
      </div>
      <ul className="relative flex flex-col gap-4">
        {badges.map((badge) => {
          const earned = badge.earnedAt != null;
          const showProgress = !earned && badge.progress.target > 1;
          const pct = Math.min(
            100,
            Math.round((badge.progress.current / badge.progress.target) * 100),
          );
          return (
            <li key={badge.id} className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
                  TIER_STYLES[badge.tier],
                  !earned && "grayscale",
                )}
              >
                <BadgeIcon
                  iconKey={badge.iconKey}
                  iconUrl={badge.iconUrl}
                  name={badge.name}
                  className="size-8"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{badge.name}</p>
                {showProgress ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {badge.progress.current}/{badge.progress.target}
                    </span>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-xs",
                      earned ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {earned ? t("badgeUnlocked") : t("badgeLocked")}
                  </p>
                )}
              </div>
              {earned ? (
                <CheckIcon
                  className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
