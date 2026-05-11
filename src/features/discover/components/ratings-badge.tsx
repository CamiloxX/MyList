import type { OmdbRatings } from "@/lib/omdb/schemas";
import { cn } from "@/lib/utils";

type Props = {
  ratings: OmdbRatings;
};

/**
 * Compact pill row showing IMDb / Rotten Tomatoes / Metacritic scores.
 * Each score is color-coded: green ≥ good, amber for middle, red for low.
 * If a score is missing (OMDb returned "N/A"), the corresponding pill is
 * omitted instead of showing a placeholder.
 */
export function RatingsBadge({ ratings }: Props) {
  const imdb = parseFloat(ratings.imdb ?? "");
  const rt = parseFloat(ratings.rottenTomatoes ?? "");
  const meta = parseFloat(ratings.metacritic ?? "");

  const items: Array<{ key: string; label: string; value: string; className: string }> = [];
  if (Number.isFinite(rt)) {
    items.push({
      key: "rt",
      label: "RT",
      value: `${Math.round(rt)}%`,
      className: tone(rt, { good: 75, ok: 60 }),
    });
  }
  if (Number.isFinite(imdb)) {
    items.push({
      key: "imdb",
      label: "IMDb",
      value: imdb.toFixed(1),
      className: tone(imdb, { good: 7.5, ok: 6 }),
    });
  }
  if (Number.isFinite(meta)) {
    items.push({
      key: "meta",
      label: "Meta",
      value: String(Math.round(meta)),
      className: tone(meta, { good: 75, ok: 50 }),
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
            item.className,
          )}
        >
          <span className="opacity-70">{item.label}</span>
          <span>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

function tone(value: number, thresholds: { good: number; ok: number }): string {
  if (value >= thresholds.good) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (value >= thresholds.ok) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
}
