/**
 * Genre name resolution for stats. Storage is heterogeneous: TMDB items keep
 * numeric genre ids, anime (Jikan) keeps English genre names. This module maps
 * both to a localized, human-readable label so "top genres" can mix sources.
 */

type Localized = { es: string; en: string };

// TMDB movie + TV genre ids (the catalog is static). Shared ids (e.g. 16, 35)
// mean the same thing across movie and TV, so one table covers both.
const TMDB_GENRES: Record<number, Localized> = {
  28: { en: "Action", es: "Acción" },
  12: { en: "Adventure", es: "Aventura" },
  16: { en: "Animation", es: "Animación" },
  35: { en: "Comedy", es: "Comedia" },
  80: { en: "Crime", es: "Crimen" },
  99: { en: "Documentary", es: "Documental" },
  18: { en: "Drama", es: "Drama" },
  10751: { en: "Family", es: "Familia" },
  14: { en: "Fantasy", es: "Fantasía" },
  36: { en: "History", es: "Historia" },
  27: { en: "Horror", es: "Terror" },
  10402: { en: "Music", es: "Música" },
  9648: { en: "Mystery", es: "Misterio" },
  10749: { en: "Romance", es: "Romance" },
  878: { en: "Science Fiction", es: "Ciencia ficción" },
  10770: { en: "TV Movie", es: "Película de TV" },
  53: { en: "Thriller", es: "Suspenso" },
  10752: { en: "War", es: "Bélica" },
  37: { en: "Western", es: "Western" },
  10759: { en: "Action & Adventure", es: "Acción y aventura" },
  10762: { en: "Kids", es: "Infantil" },
  10763: { en: "News", es: "Noticias" },
  10764: { en: "Reality", es: "Reality" },
  10765: { en: "Sci-Fi & Fantasy", es: "Ciencia ficción y fantasía" },
  10766: { en: "Soap", es: "Telenovela" },
  10767: { en: "Talk", es: "Talk show" },
  10768: { en: "War & Politics", es: "Guerra y política" },
};

// Spanish labels for the common Jikan/MAL anime genre names (keyed by the exact
// English name Jikan returns). Unknown names fall back to the raw English value.
const ANIME_GENRES_ES: Record<string, string> = {
  Action: "Acción",
  Adventure: "Aventura",
  "Avant Garde": "Vanguardia",
  "Award Winning": "Premiado",
  Comedy: "Comedia",
  Drama: "Drama",
  Erotica: "Erótica",
  Fantasy: "Fantasía",
  Gourmet: "Gourmet",
  Horror: "Terror",
  Mystery: "Misterio",
  Romance: "Romance",
  "Sci-Fi": "Ciencia ficción",
  "Slice of Life": "Recuentos de la vida",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Suspense: "Suspenso",
};

/**
 * Resolves a stored genre value (TMDB numeric id or anime string) to a label
 * in the requested locale. Returns null for unknown TMDB ids so they're skipped
 * rather than shown as a bare number.
 */
export function genreLabel(value: string | number, locale: "es" | "en"): string | null {
  if (typeof value === "number") {
    return TMDB_GENRES[value]?.[locale] ?? null;
  }
  const name = value.trim();
  if (!name) return null;
  if (locale === "es") return ANIME_GENRES_ES[name] ?? name;
  return name;
}
