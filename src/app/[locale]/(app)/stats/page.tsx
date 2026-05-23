import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  getTopOfYear,
  getTopRatedMedia,
  getUserOverview,
  type TopRatedItem,
} from "@/features/stats/queries";
import { Link } from "@/i18n/navigation";
import { currentYear } from "@/lib/dates";
import { loadingDemoDelay } from "@/lib/loading-demo";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await loadingDemoDelay();
  const t = await getTranslations();
  const [overview, topRated, topOfYear] = await Promise.all([
    getUserOverview(),
    getTopRatedMedia(5),
    getTopOfYear(Number.parseInt(currentYear(), 10), 5),
  ]);

  if (overview.totalEntries === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("stats.subtitle")}</p>
        </header>
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("stats.empty")}</p>
        </div>
      </div>
    );
  }

  const year = Number.parseInt(currentYear(), 10);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("stats.subtitle")}</p>
      </header>

      {/* Summary card */}
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="text-base font-medium">{t("stats.summaryTitle")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{overview.totalEntries}</p>
            <p className="text-xs text-muted-foreground">
              {t("stats.totalEntries", { entries: overview.totalEntries })}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{overview.totalHours}</p>
            <p className="text-xs text-muted-foreground">
              {t("stats.totalHours", { hours: overview.totalHours })}
            </p>
          </div>
        </div>
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
    </div>
  );
}

function KindHoursBar({
  hours,
  movieLabel,
  tvLabel,
  animeLabel,
}: {
  hours: { movie: number; tv: number; anime: number };
  movieLabel: string;
  tvLabel: string;
  animeLabel: string;
}) {
  const total = Math.max(0.0001, hours.movie + hours.tv + hours.anime);
  const segments = [
    { key: "movie", label: movieLabel, value: hours.movie, color: "bg-chart-1" },
    { key: "tv", label: tvLabel, value: hours.tv, color: "bg-chart-2" },
    { key: "anime", label: animeLabel, value: hours.anime, color: "bg-chart-4" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => {
          const pct = (segment.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={segment.key}
              className={segment.color}
              style={{ width: `${pct}%` }}
              title={`${segment.label}: ${segment.value} h`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span className={`inline-block size-2.5 rounded-sm ${segment.color}`} aria-hidden />
            <span className="font-medium">{segment.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{segment.value} h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
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
