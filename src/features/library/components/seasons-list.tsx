import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { tmdbImage } from "@/lib/tmdb/client";
import { getTmdbTvSeasons } from "@/lib/tmdb/tv";
import { SeasonToggle } from "./season-toggle";

/**
 * Server component that lists every season of a TMDB TV show plus a per-season
 * watched toggle. Hidden entirely (returns null) when TMDB has no seasons or
 * the fetch fails — the rest of the detail page keeps working.
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
        {seasons.map((season) => {
          const poster = tmdbImage(season.poster_path, "w154");
          const isWatched = watchedSet.has(season.season_number);
          return (
            <li
              key={season.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm"
            >
              <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {poster ? (
                  <Image
                    src={poster}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{season.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("episodeCount", { count: season.episode_count ?? 0 })}
                  {season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ""}
                </span>
              </div>
              <SeasonToggle
                mediaItemId={mediaItemId}
                seasonNumber={season.season_number}
                initialWatched={isWatched}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
