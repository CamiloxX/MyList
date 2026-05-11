import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PlatformIcon } from "@/features/library/components/platform-icon";
import { StarRatingReadonly } from "@/features/library/components/star-rating";
import { MonthPickerButton } from "@/features/stats/components/month-picker-button";
import { getMonthEntries } from "@/features/stats/queries";
import { Link } from "@/i18n/navigation";
import {
  currentYearMonth,
  formatWatchedOn,
  formatYearMonth,
  parseYearMonth,
  shiftYearMonth,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MonthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ym?: string }>;
};

export default async function MonthPage({ params, searchParams }: MonthPageProps) {
  const { locale } = await params;
  const { ym } = await searchParams;
  const yearMonth = ym && parseYearMonth(ym) ? ym : currentYearMonth();
  const summary = await getMonthEntries(yearMonth);
  const t = await getTranslations();

  if (!summary) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t("month.invalid")}
      </div>
    );
  }

  const previous = shiftYearMonth(yearMonth, -1);
  const next = shiftYearMonth(yearMonth, +1);
  const isCurrent = yearMonth === currentYearMonth();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatYearMonth(yearMonth, locale)}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {t("month.stats", { entries: summary.totalEntries, hours: summary.totalHours })}
        </div>
      </header>

      <nav className="flex items-center justify-between gap-2">
        <Link
          href={{ pathname: "/month", query: { ym: previous } }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← {formatYearMonth(previous, locale)}
        </Link>
        <div className="flex items-center gap-2">
          <MonthPickerButton current={yearMonth} />
          {!isCurrent ? (
            <Link href="/month" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {t("common.today")}
            </Link>
          ) : null}
        </div>
        <Link
          href={{ pathname: "/month", query: { ym: next } }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {formatYearMonth(next, locale)} →
        </Link>
      </nav>

      {summary.totalEntries === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("month.empty")}</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-6">
          {[...summary.entriesByDate.entries()].map(([date, entries]) => (
            <li key={date} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {formatWatchedOn(date, locale)}
              </h2>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/library/${entry.media_item_id}`}
                      className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {entry.poster_url ? (
                          <Image
                            src={entry.poster_url}
                            alt={t("posters.alt", { title: entry.title })}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">{entry.title}</span>
                          <Badge variant="secondary">{t(`kinds.${entry.kind}`)}</Badge>
                          {entry.year ? (
                            <span className="text-xs text-muted-foreground">{entry.year}</span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {entry.rating ? (
                            <StarRatingReadonly value={entry.rating} size="sm" />
                          ) : null}
                          {entry.platform ? (
                            <Badge variant="secondary" className="gap-1.5">
                              <PlatformIcon platform={entry.platform} size="sm" />
                              {entry.platform}
                            </Badge>
                          ) : null}
                        </div>
                        {entry.notes ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {entry.notes}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
