import { SparklesIcon, WrenchIcon, ZapIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import { EmptyState } from "@/components/empty-state";
import type { Locale } from "@/i18n/routing";
import { CHANGELOG, type ChangelogEntry, type ChangelogTag } from "@/lib/changelog";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

const TAG_STYLE: Record<
  ChangelogTag,
  { dot: string; chip: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  new: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    Icon: SparklesIcon,
  },
  improvement: {
    dot: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    Icon: ZapIcon,
  },
  fix: {
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    Icon: WrenchIcon,
  },
};

export default async function ChangelogPage() {
  await loadingDemoDelay();
  const t = await getTranslations("changelog");
  const locale = (await getLocale()) as Locale;

  const grouped = groupByMonth(CHANGELOG);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {grouped.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {formatMonth(group.key, locale)}
              </h2>
              <ol className="flex flex-col gap-3">
                {group.entries.map((entry) => (
                  <EntryCard
                    key={`${entry.date}-${entry.title.es}`}
                    entry={entry}
                    locale={locale}
                    tagLabel={t(`tags.${entry.tag}`)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  locale,
  tagLabel,
}: {
  entry: ChangelogEntry;
  locale: Locale;
  tagLabel: string;
}) {
  const style = TAG_STYLE[entry.tag];
  const Icon = style.Icon;
  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
            style.chip,
          )}
        >
          <Icon className="size-3" aria-hidden />
          {tagLabel}
        </span>
        <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
      </div>
      <h3 className="text-base font-medium">{entry.title[locale]}</h3>
      <p className="text-sm text-muted-foreground">{entry.description[locale]}</p>
    </li>
  );
}

type Group = { key: string; entries: ChangelogEntry[] };

function groupByMonth(entries: ChangelogEntry[]): Group[] {
  const buckets = new Map<string, ChangelogEntry[]>();
  // Sort newest first by ISO date string (lexicographic order matches chronological).
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const entry of sorted) {
    const key = entry.date.slice(0, 7); // YYYY-MM
    const bucket = buckets.get(key);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
  }
  return Array.from(buckets, ([key, entries]) => ({ key, entries }));
}

function formatMonth(yyyyMm: string, locale: Locale): string {
  const [y, m] = yyyyMm.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  const label = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "long",
  }).format(date);
}
