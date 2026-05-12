import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { tmdbImage } from "@/lib/tmdb/client";
import { getTmdbTvSeasons } from "@/lib/tmdb/tv";
import { SeasonRow } from "./season-row";

/**
 * Server component that lists every season of a TMDB TV show. Each row
 * delegates to a client SeasonRow so the user can expand it to see episodes
 * (lazy-loaded) and toggle the "watched" mark independently.
 *
 * Hidden entirely (returns null) when TMDB has no seasons or the fetch fails.
 */
export async function SeasonsList({
  mediaItemId,
  tmdbId,
}: {
  mediaItemId: string;
  tmdbId: string;
}) {
  const t = await getTranslations("library.seasons");
  const seasons = await getTmdbTvSeasons(tmdbId);
  if (!seasons || seasons.length === 0) return null;

  const supabase = await createClient();
  const { data: watchedRows } = await supabase
    .from("watch_entries")
    .select("season_number")
    .eq("media_item_id", mediaItemId)
    .not("season_number", "is", null);

  const watchedSet = new Set<number>(
    (watchedRows ?? []).map((r) => r.season_number).filter((n): n is number => n !== null),
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{t("title")}</h2>
      <ul className="flex flex-col gap-2">
        {seasons.map((season) => (
          <SeasonRow
            key={season.id}
            mediaItemId={mediaItemId}
            tmdbId={tmdbId}
            seasonNumber={season.season_number}
            name={season.name}
            episodeCount={season.episode_count ?? 0}
            airYear={season.air_date ? season.air_date.slice(0, 4) : null}
            posterUrl={tmdbImage(season.poster_path, "w154")}
            initialWatched={watchedSet.has(season.season_number)}
          />
        ))}
      </ul>
    </section>
  );
}
