import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { getYearSummary } from "@/features/stats/queries";
import { Link } from "@/i18n/navigation";
import { currentYear, monthNameByIndex, parseYear } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type YearPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ y?: string }>;
};

export default async function YearPage({ params, searchParams }: YearPageProps) {
  const { locale } = await params;
  const { y } = await searchParams;
  const year = parseYear(y) ?? Number.parseInt(currentYear(), 10);
  const summary = await getYearSummary(year);
  const t = await getTranslations();

  const isCurrent = String(year) === currentYear();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{year}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {t("year.stats", { entries: summary.totalEntries, hours: summary.totalHours })}
        </div>
      </header>

      <nav className="flex items-center justify-between gap-2">
        <Link
          href={{ pathname: "/year", query: { y: String(year - 1) } }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← {year - 1}
        </Link>
        {!isCurrent ? (
          <Link href="/year" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {t("year.currentYear")}
          </Link>
        ) : null}
        <Link
          href={{ pathname: "/year", query: { y: String(year + 1) } }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {year + 1} →
        </Link>
      </nav>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.months.map((month) => (
          <li key={month.yearMonth}>
            <Link
              href={{ pathname: "/month", query: { ym: month.yearMonth } }}
              className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <span className="text-base font-medium">
                {monthNameByIndex(month.monthIndex, locale)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("year.monthStats", {
                  entries: month.totalEntries,
                  hours: month.totalHours,
                })}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
