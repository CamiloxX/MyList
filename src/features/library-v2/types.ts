import type { OmdbRatings } from "@/lib/omdb/schemas";

/**
 * Shared shape for the desktop-prototype poster cards. The page maps TMDB /
 * Jikan / library rows into this uniform structure so the presentational
 * components never need to know which source a title came from.
 */
export type PosterKind = "movie" | "tv" | "anime";

export type PosterItem = {
  /** Stable React key, unique within a row (e.g. "movie-603"). */
  key: string;
  title: string;
  posterUrl: string | null;
  kind: PosterKind;
  /** Secondary line under the title (year, season count, etc.). */
  meta?: string;
  /** Optional navigation target; when absent the card is non-interactive. */
  href?: string;
  /** Source score (TMDB / MAL), formatted one-decimal — the cheap cover rating. */
  score?: string;
  /** OMDb RT/IMDb ratings, only attached for the bounded recommendations row. */
  ratings?: OmdbRatings | null;
};
