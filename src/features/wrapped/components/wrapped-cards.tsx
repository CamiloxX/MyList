import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { KindHoursBar } from "@/features/stats/components/charts";
import { monthNameByIndex } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { WrappedData } from "../queries";

/**
 * The Wrapped card stack, shared verbatim by the private /wrapped/[year] page
 * and the public share route. Pure presentation: one hero stat per card over
 * chart-token gradients, hand-made (no chart lib).
 */
export async function WrappedCards({ data, locale }: { data: WrappedData; locale: "es" | "en" }) {
  const t = await getTranslations("wrapped");
  const tKinds = await getTranslations("kinds");

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: titles + hours */}
      <section className="flex flex-col items-center gap-1 rounded-2xl border bg-gradient-to-br from-primary/20 via-chart-4/10 to-transparent p-8 text-center">
        <span className="text-sm font-medium text-muted-foreground">{t("heroLabel")}</span>
        <span className="text-6xl font-extrabold tabular-nums tracking-tight">
          {data.totalTitles}
        </span>
        <span className="text-sm text-muted-foreground">{t("titles")}</span>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <span>
            <strong className="tabular-nums">{data.totalEntries}</strong> {t("viewings")}
          </span>
          <span>
            <strong className="tabular-nums">{data.totalHours}</strong> {t("hours")}
          </span>
        </div>
      </section>

      {/* Top genre */}
      {data.topGenre ? (
        <StatCard
          label={t("topGenre")}
          value={data.topGenre}
          className="from-chart-1/20 via-chart-1/5"
        />
      ) : null}

      {/* Most active month */}
      {data.mostActiveMonth ? (
        <StatCard
          label={t("mostActiveMonth")}
          value={monthNameByIndex(data.mostActiveMonth.index, locale)}
          detail={t("mostActiveMonthCount", { count: data.mostActiveMonth.entries })}
          className="from-chart-2/20 via-chart-2/5"
        />
      ) : null}

      {/* Longest streak */}
      {data.longestStreak > 1 ? (
        <StatCard
          label={t("longestStreak")}
          value={t("streakDays", { days: data.longestStreak })}
          className="from-chart-4/20 via-chart-4/5"
        />
      ) : null}

      {/* Best rated of the year */}
      {data.topRated.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-6">
          <span className="text-sm font-medium text-muted-foreground">{t("topRated")}</span>
          <ol className="flex flex-col gap-2">
            {data.topRated.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="text-lg font-bold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={item.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                <Badge variant="secondary" className="tabular-nums">
                  ★ {item.bestRating}/10
                </Badge>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Hours by kind */}
      <section className="flex flex-col gap-3">
        <span className="text-sm font-medium text-muted-foreground">{t("byKind")}</span>
        <KindHoursBar
          hours={data.hoursByKind}
          movieLabel={tKinds("movie")}
          tvLabel={tKinds("tv")}
          animeLabel={tKinds("anime")}
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border bg-gradient-to-br to-transparent p-8 text-center",
        className,
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-4xl font-extrabold tracking-tight">{value}</span>
      {detail ? <span className="text-sm text-muted-foreground">{detail}</span> : null}
    </section>
  );
}
