import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { AddToLibraryButton } from "@/features/library/components/add-to-library-button";
import { libraryItemKey } from "@/features/library/queries";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { WatchOrderEntry } from "../watch-order";

const KNOWN_RELATIONS = new Set([
  "prequel",
  "sequel",
  "sideStory",
  "parentStory",
  "summary",
  "alternativeVersion",
  "fullStory",
  "spinOff",
]);

/** "Side story" → "sideStory", "Spin-off" → "spinOff". */
function relationSlug(raw: string): string {
  const words = raw.trim().split(/[\s-]+/);
  return words
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

/**
 * Numbered, ordered list of franchise entries. Owned entries link to their
 * detail and show an "in your library" check; not-owned ones link to the preview
 * and offer a one-tap add. The current title is highlighted. Mirrors SeasonsList.
 */
export async function WatchOrderList({
  entries,
  ownedMap,
}: {
  entries: WatchOrderEntry[];
  ownedMap: Map<string, string>;
}) {
  const t = await getTranslations("libraryV2.watchOrder");
  const tk = await getTranslations();

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const key = libraryItemKey({
          source: entry.source,
          sourceId: entry.sourceId,
          kind: entry.kind,
        });
        const ownedId = ownedMap.get(key);
        const href = ownedId
          ? `/library/${ownedId}`
          : `/library/title/${entry.source}/${entry.kind}/${entry.sourceId}`;
        const slug = entry.relationLabel ? relationSlug(entry.relationLabel) : null;
        const relation =
          slug && KNOWN_RELATIONS.has(slug) ? t(`relations.${slug}`) : entry.relationLabel;
        const meta = [entry.year ? String(entry.year) : null, relation].filter(Boolean).join(" · ");

        return (
          <li
            key={`${entry.source}-${entry.sourceId}`}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-card p-2.5",
              entry.isCurrent && "border-primary/50 bg-primary/5",
            )}
          >
            <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                {entry.posterUrl ? (
                  <Image
                    src={entry.posterUrl}
                    alt={tk("posters.alt", { title: entry.title })}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{entry.title}</span>
                {meta ? (
                  <span className="truncate text-xs text-muted-foreground">{meta}</span>
                ) : null}
              </div>
            </Link>
            <div className="shrink-0">
              {entry.isCurrent ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {t("current")}
                </Badge>
              ) : ownedId ? (
                <span className="inline-flex items-center gap-1 px-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckIcon className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{t("owned")}</span>
                </span>
              ) : (
                <AddToLibraryButton
                  source={entry.source}
                  sourceId={entry.sourceId}
                  kind={entry.kind}
                  title={entry.title}
                  posterUrl={entry.posterUrl}
                  year={entry.year}
                  genres={[]}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
