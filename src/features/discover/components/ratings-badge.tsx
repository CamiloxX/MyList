import type { OmdbRatings } from "@/lib/omdb/schemas";
import { ImdbWordmark, MetacriticTile, TomatoIcon } from "./score-icons";

type Props = {
  ratings: OmdbRatings;
};

/**
 * Inline row of review scores. Each score uses the iconography users already
 * recognize from the source service:
 *   - 🍅 Rotten Tomatoes (fresh red / rotten green) + percentage
 *   - IMDb yellow wordmark + score / 10
 *   - Metacritic colored tile + score / 100
 *
 * No background pills, just icon + number with tabular-nums so digits align
 * across cards. Missing scores are skipped silently; if all three are
 * missing the badge renders nothing.
 */
export function RatingsBadge({ ratings }: Props) {
  const imdb = parseFloat(ratings.imdb ?? "");
  const rt = parseFloat(ratings.rottenTomatoes ?? "");
  const meta = parseFloat(ratings.metacritic ?? "");

  const hasRt = Number.isFinite(rt);
  const hasImdb = Number.isFinite(imdb);
  const hasMeta = Number.isFinite(meta);

  if (!hasRt && !hasImdb && !hasMeta) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
      {hasRt ? (
        <span
          className="inline-flex items-center gap-1.5 font-semibold tabular-nums"
          title={`Rotten Tomatoes ${Math.round(rt)}%`}
        >
          <TomatoIcon fresh={rt >= 60} className="size-4" />
          <span>{Math.round(rt)}%</span>
        </span>
      ) : null}
      {hasImdb ? (
        <span
          className="inline-flex items-center gap-1.5 font-semibold tabular-nums"
          title={`IMDb ${imdb.toFixed(1)} / 10`}
        >
          <ImdbWordmark className="h-3.5 w-auto" />
          <span>{imdb.toFixed(1)}</span>
        </span>
      ) : null}
      {hasMeta ? (
        <span
          className="inline-flex items-center gap-1.5 font-semibold tabular-nums"
          title={`Metacritic ${Math.round(meta)} / 100`}
        >
          <MetacriticTile value={Math.round(meta)} className="size-4" />
          <span>{Math.round(meta)}</span>
        </span>
      ) : null}
    </div>
  );
}
