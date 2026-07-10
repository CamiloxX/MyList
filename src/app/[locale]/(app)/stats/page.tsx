import { ClapperboardIcon, ClockIcon, FlameIcon, TrophyIcon } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BarList, EmptyHint, KindHoursBar, StatTile } from "@/features/stats/components/charts";
import {
  type ActivityStats,
  getActivityStats,
  getLibraryBreakdown,
  getTopOfYear,
  getTopRatedMedia,
  getUserOverview,
  getYearlyStats,
  type TopRatedItem,
  type YearlyStat,
} from "@/features/stats/queries";
import { Link } from "@/i18n/navigation";
import { currentYear } from "@/lib/dates";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await loadingDemoDelay();
  const t = await getTranslations();
  const locale = (await getLocale()) === "en" ? "en" : "es";
  const [overview, topRated, topOfYear, activity, breakdown, yearly] = await Promise.all([
    getUserOverview(),
    getTopRatedMedia(5),
    getTopOfYear(Number.parseInt(currentYear(), 10), 5),
    getActivityStats(),
    getLibraryBreakdown(locale),
    getYearlyStats(locale),
  ]);

  if (overview.totalEntries === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("stats.subtitle")}</p>
        </header>
        <EmptyState title={t("stats.empty")} />
      </div>
    );
  }

  const year = Number.parseInt(currentYear(), 10);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("stats.subtitle")}</p>
        </div>
        <Link
          href={`/wrapped/${year}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5")}
        >
          ✨ {t("wrapped.openWrapped", { year })}
        </Link>
      </header>

      {/* Summary tiles */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.summaryTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            Icon={ClapperboardIcon}
            value={overview.totalEntries}
            label={t("stats.labelEntries")}
            iconClass="bg-chart-1/15 text-chart-1"
          />
          <StatTile
            Icon={ClockIcon}
            value={overview.totalHours}
            label={t("stats.labelHours")}
            iconClass="bg-chart-2/15 text-chart-2"
          />
          <StatTile
            Icon={FlameIcon}
            value={activity.currentStreak}
            label={t("stats.currentStreak")}
            iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <StatTile
            Icon={TrophyIcon}
            value={activity.longestStreak}
            label={t("stats.longestStreak")}
            iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
        </div>
      </section>

      {/* Activity heatmap */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-medium">{t("stats.heatmapTitle")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("stats.activeDays", { days: activity.activeDays })}
          </span>
        </div>
        <ActivityHeatmap
          activity={activity}
          lessLabel={t("stats.heatmapLess")}
          moreLabel={t("stats.heatmapMore")}
        />
      </section>

      {/* Hours by kind */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.byKindTitle")}</h2>
        <KindHoursBar
          hours={overview.hoursByKind}
          movieLabel={t("kinds.movie")}
          tvLabel={t("kinds.tv")}
          animeLabel={t("kinds.anime")}
        />
      </section>

      {/* Top rated overall */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.topRatedTitle")}</h2>
        {topRated.length === 0 ? (
          <EmptyHint message={t("stats.topRatedEmpty")} />
        ) : (
          <TopList items={topRated} t={t} />
        )}
      </section>

      {/* Top of current year */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.topOfYearTitle", { year })}</h2>
        {topOfYear.length === 0 ? (
          <EmptyHint message={t("stats.topOfYearEmpty", { year })} />
        ) : (
          <TopList items={topOfYear} t={t} />
        )}
      </section>

      {/* Top genres */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.genresTitle")}</h2>
        {breakdown.topGenres.length === 0 ? (
          <EmptyHint message={t("stats.genresEmpty")} />
        ) : (
          <BarList items={breakdown.topGenres.map((g) => ({ label: g.name, value: g.count }))} />
        )}
      </section>

      {/* By decade */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.decadesTitle")}</h2>
        {breakdown.decades.length === 0 ? (
          <EmptyHint message={t("stats.decadesEmpty")} />
        ) : (
          <BarList
            items={breakdown.decades.map((d) => ({
              label: t("stats.decadeLabel", { decade: d.decade }),
              value: d.count,
            }))}
          />
        )}
      </section>

      {/* Year over year */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("stats.yearly.title")}</h2>
        {yearly.length === 0 ? (
          <EmptyHint message={t("stats.yearly.empty")} />
        ) : (
          <YearlyComparison
            years={yearly}
            entriesLabel={t("stats.yearly.entries")}
            hoursLabel={t("stats.yearly.hours")}
          />
        )}
      </section>
    </div>
  );
}

/**
 * One row per year: entries + hours bars normalized to the all-time maxima,
 * delta vs the previous year, and the dominant genre as a chip.
 */
function YearlyComparison({
  years,
  entriesLabel,
  hoursLabel,
}: {
  years: YearlyStat[];
  entriesLabel: string;
  hoursLabel: string;
}) {
  const maxEntries = Math.max(1, ...years.map((y) => y.totalEntries));
  const maxHours = Math.max(1, ...years.map((y) => y.totalHours));

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-4">
      {years.map((year, index) => {
        const prev = index > 0 ? years[index - 1] : undefined;
        const delta =
          prev && prev.totalEntries > 0
            ? Math.round(((year.totalEntries - prev.totalEntries) / prev.totalEntries) * 100)
            : null;
        return (
          <div key={year.year} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{year.year}</span>
              {delta !== null ? (
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    delta >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
                </span>
              ) : null}
              {year.dominantGenre ? (
                <Badge variant="secondary" className="ml-auto">
                  {year.dominantGenre}
                </Badge>
              ) : null}
            </div>
            <YearBar
              label={entriesLabel}
              value={year.totalEntries}
              max={maxEntries}
              barClass="bg-chart-1"
            />
            <YearBar
              label={hoursLabel}
              value={year.totalHours}
              max={maxHours}
              barClass="bg-chart-2"
            />
          </div>
        );
      })}
    </div>
  );
}

function YearBar({
  label,
  value,
  max,
  barClass,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.max(1.5, (value / max) * 100)}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

const HEATMAP_LEVELS = [
  "bg-muted",
  "bg-emerald-500/30",
  "bg-emerald-500/50",
  "bg-emerald-500/70",
  "bg-emerald-500",
] as const;

/** Maps a day's count to one of 5 intensity buckets (0 = empty). */
function heatmapLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function ActivityHeatmap({
  activity,
  lessLabel,
  moreLabel,
}: {
  activity: ActivityStats;
  lessLabel: string;
  moreLabel: string;
}) {
  const weeks: ActivityStats["days"][] = [];
  for (let i = 0; i < activity.days.length; i += 7) {
    weeks.push(activity.days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {weeks.map((week) => (
            <div key={week[0]?.date} className="flex flex-col gap-1">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className={cn("size-2.5 rounded-[2px]", HEATMAP_LEVELS[heatmapLevel(day.count)])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span>{lessLabel}</span>
        {HEATMAP_LEVELS.map((cls) => (
          <span key={cls} className={cn("size-2.5 rounded-[2px]", cls)} aria-hidden />
        ))}
        <span>{moreLabel}</span>
      </div>
    </div>
  );
}

function TopList({
  items,
  t,
}: {
  items: TopRatedItem[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={item.id}>
          <Link
            href={`/library/${item.id}`}
            className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30"
          >
            <span className="self-center text-base font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.poster_url ? (
                <Image
                  src={item.poster_url}
                  alt={t("posters.alt", { title: item.title })}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
                {item.year ? (
                  <span className="text-xs text-muted-foreground">{item.year}</span>
                ) : null}
              </div>
              <Badge variant="default" className="self-start">
                {t("stats.rating", { rating: item.bestRating })}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
