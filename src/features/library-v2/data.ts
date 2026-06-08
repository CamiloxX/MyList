import "server-only";

import { discoverAnime, getAnimeGenres } from "@/lib/jikan/discover";
import type { JikanAnime } from "@/lib/jikan/schemas";
import { jikanPoster, jikanTitle } from "@/lib/jikan/search";
import { discoverMovies, discoverTv, getMovieGenres, getTvGenres } from "@/lib/tmdb/discover";
import { tmdbImage } from "@/lib/tmdb/images";
import type { TmdbMovie, TmdbTv } from "@/lib/tmdb/schemas";
import type { GenreChip } from "./components/genre-chips";
import type { PosterItem } from "./types";

/** Rows the page reads from the user's library to mine genres. */
type LibraryGenreRow = { kind: string; genres: unknown };

const MAX_CHIPS = 8;

function yearFrom(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const y = date.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : undefined;
}

/** Source score (TMDB / MAL) formatted one-decimal, or undefined when absent. */
function fmtScore(value: number | null | undefined): string | undefined {
  return typeof value === "number" && value > 0 ? value.toFixed(1) : undefined;
}

/**
 * Recommendation / discover cards link to the in-app title preview, where the
 * user can read the info and add it to their library (or, if it's already in
 * the library, the preview route redirects them to the full detail view).
 */
function titleHref(source: string, kind: string, sourceId: string | number): string {
  return `/library-v2/title/${source}/${kind}/${sourceId}`;
}

export function movieToPoster(m: TmdbMovie): PosterItem {
  return {
    key: `movie-${m.id}`,
    title: m.title,
    posterUrl: tmdbImage(m.poster_path, "w342"),
    kind: "movie",
    meta: yearFrom(m.release_date),
    href: titleHref("tmdb", "movie", m.id),
    score: fmtScore(m.vote_average),
  };
}

export function tvToPoster(t: TmdbTv): PosterItem {
  return {
    key: `tv-${t.id}`,
    title: t.name,
    posterUrl: tmdbImage(t.poster_path, "w342"),
    kind: "tv",
    meta: yearFrom(t.first_air_date),
    href: titleHref("tmdb", "tv", t.id),
    score: fmtScore(t.vote_average),
  };
}

export function animeToPoster(a: JikanAnime): PosterItem {
  const title = jikanTitle(a);
  return {
    key: `anime-${a.mal_id}`,
    title,
    posterUrl: jikanPoster(a),
    kind: "anime",
    meta: a.year ? String(a.year) : undefined,
    href: titleHref("anilist", "anime", a.mal_id),
    score: fmtScore(a.score),
  };
}

/**
 * Derives genre pills from the user's library: counts the genres they already
 * own per kind, then resolves the numeric TMDB ids / anime names into display
 * labels. Each chip carries an encoded "kind:id" value the page uses to drive
 * the real browse-by-genre fetch.
 */
export async function getGenreChips(rows: ReadonlyArray<LibraryGenreRow>): Promise<GenreChip[]> {
  const movieCounts = new Map<number, number>();
  const tvCounts = new Map<number, number>();
  const animeCounts = new Map<string, number>();

  for (const row of rows) {
    const genres = Array.isArray(row.genres) ? row.genres : [];
    if (row.kind === "movie") {
      for (const g of genres)
        if (typeof g === "number") movieCounts.set(g, (movieCounts.get(g) ?? 0) + 1);
    } else if (row.kind === "tv") {
      for (const g of genres)
        if (typeof g === "number") tvCounts.set(g, (tvCounts.get(g) ?? 0) + 1);
    } else if (row.kind === "anime") {
      for (const g of genres)
        if (typeof g === "string") animeCounts.set(g, (animeCounts.get(g) ?? 0) + 1);
    }
  }

  const [movieCatalog, tvCatalog, animeCatalog] = await Promise.all([
    movieCounts.size > 0 ? getMovieGenres().catch(() => []) : Promise.resolve([]),
    tvCounts.size > 0 ? getTvGenres().catch(() => []) : Promise.resolve([]),
    animeCounts.size > 0 ? getAnimeGenres().catch(() => []) : Promise.resolve([]),
  ]);

  const movieNames = new Map(movieCatalog.map((g) => [g.id, g.name]));
  const tvNames = new Map(tvCatalog.map((g) => [g.id, g.name]));
  const animeIds = new Map(animeCatalog.map((g) => [g.name.toLowerCase(), g.mal_id]));

  type Scored = { chip: GenreChip; count: number };
  const scored: Scored[] = [];

  for (const [id, count] of movieCounts) {
    const name = movieNames.get(id);
    if (name) scored.push({ chip: { value: `movie:${id}`, label: name }, count });
  }
  for (const [id, count] of tvCounts) {
    const name = tvNames.get(id);
    if (name) scored.push({ chip: { value: `tv:${id}`, label: name }, count });
  }
  for (const [name, count] of animeCounts) {
    const malId = animeIds.get(name.toLowerCase());
    if (malId) scored.push({ chip: { value: `anime:${malId}`, label: name }, count });
  }

  // Dedupe by label (movie & tv share many names) keeping the highest count.
  const byLabel = new Map<string, Scored>();
  for (const s of scored) {
    const prev = byLabel.get(s.chip.label.toLowerCase());
    if (!prev || s.count > prev.count) byLabel.set(s.chip.label.toLowerCase(), s);
  }

  return [...byLabel.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_CHIPS)
    .map((s) => s.chip);
}

/** Parsed genre selection. */
export type GenreSelection = { kind: "movie" | "tv" | "anime"; id: number };

export function parseGenre(value: string | undefined): GenreSelection | null {
  if (!value) return null;
  const [kind, rawId] = value.split(":");
  const id = Number.parseInt(rawId ?? "", 10);
  if (!Number.isFinite(id)) return null;
  if (kind === "movie" || kind === "tv" || kind === "anime") return { kind, id };
  return null;
}

/** Runs the real /discover (or Jikan) fetch for a selected genre. */
export async function browseGenre(selection: GenreSelection): Promise<PosterItem[]> {
  if (selection.kind === "movie") {
    const movies = await discoverMovies({
      withGenres: [selection.id],
      sortBy: "popularity.desc",
      minVote: 6,
    });
    return movies.map(movieToPoster);
  }
  if (selection.kind === "tv") {
    const tv = await discoverTv({
      withGenres: [selection.id],
      sortBy: "popularity.desc",
      minVote: 6,
    });
    return tv.map(tvToPoster);
  }
  const anime = await discoverAnime({ genres: [selection.id], minScore: 6 });
  return anime.map(animeToPoster);
}
