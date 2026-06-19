/**
 * Hand-curated watch orders for popular franchises the APIs can't derive
 * automatically — live-action movie sagas (TMDB ids) and anime franchises
 * (MyAnimeList ids, verified one-by-one via Jikan). Each list is the recommended
 * watch order; titles, posters and years are resolved at render time via the
 * cached detail fetch, so this file stays tiny. Add more by appending below.
 */
export type CuratedEntry =
  | { source: "tmdb"; kind: "movie" | "tv"; sourceId: string }
  | { source: "anilist"; kind: "anime"; sourceId: string };

export type CuratedFranchise = {
  id: string;
  name: string;
  /** Display category — drives the icon on the watch-order index. */
  category: "movie" | "anime";
  /** Recommended watch order (in-universe / story order). */
  chronological: CuratedEntry[];
};

function movies(...ids: number[]): CuratedEntry[] {
  return ids.map((id) => ({ source: "tmdb", kind: "movie", sourceId: String(id) }));
}

/** Anime entries by MyAnimeList id (the app's `anilist`/anime key). */
function animes(...malIds: number[]): CuratedEntry[] {
  return malIds.map((id) => ({ source: "anilist", kind: "anime", sourceId: String(id) }));
}

export const CURATED_FRANCHISES: CuratedFranchise[] = [
  {
    id: "mcu-infinity-saga",
    name: "Marvel — Saga del Infinito",
    category: "movie",
    // Chronological (in-universe) order of the Infinity Saga.
    chronological: movies(
      1771, // Captain America: The First Avenger
      299537, // Captain Marvel
      1726, // Iron Man
      10138, // Iron Man 2
      1724, // The Incredible Hulk
      10195, // Thor
      24428, // The Avengers
      68721, // Iron Man 3
      76338, // Thor: The Dark World
      100402, // Captain America: The Winter Soldier
      118340, // Guardians of the Galaxy
      283995, // Guardians of the Galaxy Vol. 2
      99861, // Avengers: Age of Ultron
      102899, // Ant-Man
      271110, // Captain America: Civil War
      497698, // Black Widow
      315635, // Spider-Man: Homecoming
      284052, // Doctor Strange
      284054, // Black Panther
      284053, // Thor: Ragnarok
      363088, // Ant-Man and the Wasp
      299536, // Avengers: Infinity War
      299534, // Avengers: Endgame
      429617, // Spider-Man: Far From Home
    ),
  },
  {
    id: "star-wars-skywalker",
    name: "Star Wars — Saga Skywalker",
    category: "movie",
    // Episode order I–IX.
    chronological: movies(
      1893, // The Phantom Menace
      1894, // Attack of the Clones
      1895, // Revenge of the Sith
      11, // A New Hope
      1891, // The Empire Strikes Back
      1892, // Return of the Jedi
      140607, // The Force Awakens
      181808, // The Last Jedi
      181812, // The Rise of Skywalker
    ),
  },

  // --- Anime — recommended watch orders; MAL ids verified one-by-one via the
  // Jikan API (research workflow, 2026-06). Stored as MyAnimeList ids.
  {
    id: "fate",
    name: "Fate",
    category: "anime",
    // Fate/Zero → Unlimited Blade Works → Heaven's Feel (Ufotable, story order).
    chronological: animes(10087, 11741, 22297, 28701, 25537, 33049, 33050),
  },
  {
    id: "monogatari",
    name: "Monogatari",
    category: "anime",
    // Recommended order (Kizu moved up after Bakemonogatari).
    chronological: animes(
      5081,
      9260,
      31757,
      31758,
      11597,
      15689,
      17074,
      21855,
      28025,
      31181,
      32268,
      35247,
      36999,
      57864,
    ),
  },
  {
    id: "evangelion",
    name: "Evangelion",
    category: "anime",
    // NGE TV → End of Evangelion → Rebuild 1.0/2.0/3.0/3.0+1.0.
    chronological: animes(30, 32, 2759, 3784, 3785, 3786),
  },
  {
    id: "madoka-magica",
    name: "Madoka Magica",
    category: "anime",
    // TV → recap movies (Beginnings/Eternal) → Rebellion.
    chronological: animes(9756, 11977, 11979, 11981),
  },
  {
    id: "code-geass",
    name: "Code Geass",
    category: "anime",
    // R1 → R2 → Lelouch of the Re;surrection.
    chronological: animes(1575, 2904, 34437),
  },
  {
    id: "haruhi",
    name: "La Melancolía de Haruhi Suzumiya",
    category: "anime",
    // TV (2006) → 2009 continuation → The Disappearance movie.
    chronological: animes(849, 4382, 7311),
  },
  {
    id: "gurren-lagann",
    name: "Gurren Lagann",
    category: "anime",
    // TV → compilation movies Gurren-hen / Lagann-hen.
    chronological: animes(2001, 4107, 4565),
  },
  {
    id: "demon-slayer",
    name: "Demon Slayer",
    category: "anime",
    // S1 → Mugen Train arc (TV) → Entertainment District → Swordsmith → Hashira.
    chronological: animes(38000, 49926, 47778, 51019, 55701),
  },
  {
    id: "jujutsu-kaisen",
    name: "Jujutsu Kaisen",
    category: "anime",
    // S1 → JJK 0 (movie) → S2 (release order, recommended for newcomers).
    chronological: animes(40748, 48561, 51009),
  },
  {
    id: "sword-art-online",
    name: "Sword Art Online",
    category: "anime",
    // Release order: SAO → SAO II → Ordinal Scale → Alicization arc → Progressive.
    chronological: animes(11757, 21881, 31765, 36474, 39597, 40540, 42916, 50275),
  },
  {
    id: "attack-on-titan",
    name: "Attack on Titan",
    category: "anime",
    // S1 → S2 → S3 → S3 Part 2 → Final Season parts → Kanketsu-hen.
    chronological: animes(16498, 25777, 35760, 38524, 40028, 48583, 51535),
  },
];

/** Finds the curated franchise a title belongs to (by exact source/kind/id). */
export function findCuratedFranchise(
  source: string,
  kind: string,
  sourceId: string,
): CuratedFranchise | null {
  for (const franchise of CURATED_FRANCHISES) {
    if (
      franchise.chronological.some(
        (e) => e.source === source && e.kind === kind && e.sourceId === sourceId,
      )
    ) {
      return franchise;
    }
  }
  return null;
}
