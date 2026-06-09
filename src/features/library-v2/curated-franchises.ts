/**
 * Hand-curated in-universe chronological orders for popular live-action
 * franchises that TMDB can't derive automatically (they span multiple TMDB
 * collections, or have no collection at all). Each list is the canonical
 * *chronological* watch order; the release order is derived by sorting these
 * same entries by their TMDB release date.
 *
 * Stores only TMDB ids (verified against the API) — titles/posters/years are
 * resolved at render time via the cached TMDB detail fetch, so this file stays
 * tiny and easy to extend. Add more franchises by appending to the array.
 */
export type CuratedEntry = { source: "tmdb"; kind: "movie" | "tv"; sourceId: string };

export type CuratedFranchise = {
  id: string;
  name: string;
  /** In-universe chronological order. */
  chronological: CuratedEntry[];
};

function movies(...ids: number[]): CuratedEntry[] {
  return ids.map((id) => ({ source: "tmdb", kind: "movie", sourceId: String(id) }));
}

export const CURATED_FRANCHISES: CuratedFranchise[] = [
  {
    id: "mcu-infinity-saga",
    name: "Marvel — Saga del Infinito",
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
];

/** Finds the curated franchise a title belongs to (by exact source/kind/id). */
export function findCuratedFranchise(
  source: string,
  kind: string,
  sourceId: string,
): CuratedFranchise | null {
  if (source !== "tmdb") return null;
  for (const franchise of CURATED_FRANCHISES) {
    if (franchise.chronological.some((e) => e.kind === kind && e.sourceId === sourceId)) {
      return franchise;
    }
  }
  return null;
}
