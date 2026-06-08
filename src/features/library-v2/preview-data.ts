import "server-only";

import { z } from "zod";
import type { AddToLibraryInput } from "@/features/library/schemas";
import type { AiringStatus } from "@/lib/airing-status";
import { getJikanAiringStatus } from "@/lib/jikan/airing";
import { jikanFetch } from "@/lib/jikan/client";
import { jikanAnimeSchema } from "@/lib/jikan/schemas";
import { jikanOriginalTitle, jikanPoster, jikanTitle } from "@/lib/jikan/search";
import { getJikanTrailer } from "@/lib/jikan/videos";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { tmdbFetch } from "@/lib/tmdb/client";
import { tmdbImage } from "@/lib/tmdb/images";
import { getTmdbTvAiringStatus } from "@/lib/tmdb/tv";
import { getTmdbTrailer } from "@/lib/tmdb/videos";
import { fetchTitleRatings } from "./ratings";

/**
 * Normalized title data for the "not yet in your library" preview page. Carries
 * both the fields the hero/detail render needs and a ready-to-use add payload so
 * the AddToLibraryButton can drop the title into the library with one click.
 */
export type TitlePreview = {
  source: "tmdb" | "anilist";
  kind: "movie" | "tv" | "anime";
  sourceId: string;
  title: string;
  originalTitle: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: number | null;
  score: string | null;
  episodeCount: number | null;
  genreNames: string[];
  synopsis: string | null;
  /** Spread straight into <AddToLibraryButton />. */
  addPayload: AddToLibraryInput;
  trailer: { youtubeKey: string } | null;
  airing: AiringStatus;
  ratings: OmdbRatings | null;
};

/** The metadata half of a preview, before trailer/airing/ratings are attached. */
type BaseTitlePreview = Omit<TitlePreview, "trailer" | "airing" | "ratings">;

const tmdbGenre = z.object({ id: z.number(), name: z.string() });

const tmdbMovieDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  vote_average: z.number().nullable().optional(),
  runtime: z.number().nullable().optional(),
  genres: z.array(tmdbGenre).default([]),
});

const tmdbTvDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  first_air_date: z.string().nullable().optional(),
  vote_average: z.number().nullable().optional(),
  number_of_episodes: z.number().nullable().optional(),
  episode_run_time: z.array(z.number()).default([]),
  genres: z.array(tmdbGenre).default([]),
});

const jikanAnimeResponseSchema = z.object({ data: jikanAnimeSchema });

function yearFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const y = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function fmtScore(value: number | null | undefined): string | null {
  return typeof value === "number" && value > 0 ? value.toFixed(1) : null;
}

function backdrop(path: string | null | undefined): string | null {
  return path ? `https://image.tmdb.org/t/p/w1280${path}` : null;
}

/**
 * Fetches and normalizes a not-yet-added title from its source, plus its
 * trailer, airing state and OMDb ratings (in parallel). Returns null on any
 * failure (bad id, network) so the caller can 404 gracefully.
 */
export async function loadTitlePreview(
  source: string,
  kind: string,
  sourceId: string,
): Promise<TitlePreview | null> {
  const base = await loadBase(source, kind, sourceId);
  if (!base) return null;

  const [trailer, airing, ratings] = await Promise.all([
    fetchTrailer(source, kind, sourceId),
    fetchAiring(source, kind, sourceId),
    fetchTitleRatings(source, kind, sourceId),
  ]);

  return { ...base, trailer, airing, ratings };
}

async function fetchTrailer(
  source: string,
  kind: string,
  sourceId: string,
): Promise<{ youtubeKey: string } | null> {
  try {
    if (source === "tmdb" && (kind === "movie" || kind === "tv")) {
      return await getTmdbTrailer(kind, sourceId);
    }
    if (source === "anilist" && kind === "anime") {
      return await getJikanTrailer(sourceId);
    }
  } catch {
    // Trailer is optional; never break the preview over it.
  }
  return null;
}

async function fetchAiring(source: string, kind: string, sourceId: string): Promise<AiringStatus> {
  try {
    if (source === "tmdb" && kind === "tv") return await getTmdbTvAiringStatus(sourceId);
    if (source === "anilist" && kind === "anime") return await getJikanAiringStatus(sourceId);
  } catch {
    // Fall through to "unknown".
  }
  return "unknown";
}

/**
 * Fetches and normalizes the metadata for a not-yet-added title from its source.
 */
async function loadBase(
  source: string,
  kind: string,
  sourceId: string,
): Promise<BaseTitlePreview | null> {
  try {
    if (source === "tmdb" && kind === "movie") {
      const raw = await tmdbFetch<unknown>(`/movie/${sourceId}`, { revalidate: 86400 });
      const m = tmdbMovieDetailSchema.parse(raw);
      const posterUrl = tmdbImage(m.poster_path, "w342");
      return {
        source: "tmdb",
        kind: "movie",
        sourceId,
        title: m.title,
        originalTitle: m.original_title ?? null,
        posterUrl,
        backdropUrl: backdrop(m.backdrop_path),
        year: yearFromDate(m.release_date),
        score: fmtScore(m.vote_average),
        episodeCount: null,
        genreNames: m.genres.map((g) => g.name),
        synopsis: m.overview?.trim() || null,
        addPayload: {
          source: "tmdb",
          sourceId,
          kind: "movie",
          title: m.title,
          originalTitle: m.original_title ?? undefined,
          posterUrl,
          year: yearFromDate(m.release_date),
          runtimeMinutes: m.runtime ?? null,
          episodeCount: null,
          genres: m.genres.map((g) => g.id),
          rawMetadata: raw,
        },
      };
    }

    if (source === "tmdb" && kind === "tv") {
      const raw = await tmdbFetch<unknown>(`/tv/${sourceId}`, { revalidate: 86400 });
      const tv = tmdbTvDetailSchema.parse(raw);
      const posterUrl = tmdbImage(tv.poster_path, "w342");
      return {
        source: "tmdb",
        kind: "tv",
        sourceId,
        title: tv.name,
        originalTitle: tv.original_name ?? null,
        posterUrl,
        backdropUrl: backdrop(tv.backdrop_path),
        year: yearFromDate(tv.first_air_date),
        score: fmtScore(tv.vote_average),
        episodeCount: tv.number_of_episodes ?? null,
        genreNames: tv.genres.map((g) => g.name),
        synopsis: tv.overview?.trim() || null,
        addPayload: {
          source: "tmdb",
          sourceId,
          kind: "tv",
          title: tv.name,
          originalTitle: tv.original_name ?? undefined,
          posterUrl,
          year: yearFromDate(tv.first_air_date),
          runtimeMinutes: tv.episode_run_time[0] ?? null,
          episodeCount: tv.number_of_episodes ?? null,
          genres: tv.genres.map((g) => g.id),
          rawMetadata: raw,
        },
      };
    }

    if (source === "anilist" && kind === "anime") {
      const raw = await jikanFetch<unknown>(`/anime/${sourceId}`, { revalidate: 86400 });
      const { data: a } = jikanAnimeResponseSchema.parse(raw);
      const title = jikanTitle(a);
      const posterUrl = jikanPoster(a);
      return {
        source: "anilist",
        kind: "anime",
        sourceId,
        title,
        originalTitle: jikanOriginalTitle(a) ?? null,
        posterUrl,
        backdropUrl: null,
        year: a.year ?? null,
        score: fmtScore(a.score),
        episodeCount: a.episodes ?? null,
        genreNames: a.genres.map((g) => g.name),
        synopsis: a.synopsis?.trim() || null,
        addPayload: {
          source: "anilist",
          sourceId,
          kind: "anime",
          title,
          originalTitle: jikanOriginalTitle(a) ?? undefined,
          posterUrl,
          year: a.year ?? null,
          runtimeMinutes: null,
          episodeCount: a.episodes ?? null,
          genres: a.genres.map((g) => g.name),
          rawMetadata: a,
        },
      };
    }

    return null;
  } catch (error) {
    console.warn("[library-v2] loadTitlePreview failed:", error);
    return null;
  }
}
