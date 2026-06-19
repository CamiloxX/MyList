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
  {
    id: "steins-gate",
    name: "Steins;Gate",
    category: "anime",
    // TV → Steins;Gate 0 → movie (Fuka Ryouiki no Déjà vu). Side specials optional.
    chronological: animes(9253, 30484, 11577),
  },

  // --- Anime, batch 2 (popular franchises; MAL ids verified one-by-one via the
  // Jikan API by a multi-agent research workflow, 2026-06). ---------------------
  {
    id: "naruto",
    name: "Naruto",
    category: "anime",
    chronological: animes(20, 1735, 16870, 34566),
  },
  {
    id: "dragon-ball",
    name: "Dragon Ball",
    category: "anime",
    chronological: animes(223, 813, 14837, 25389, 30694, 36946, 48903),
  },
  {
    id: "bleach",
    name: "Bleach",
    category: "anime",
    chronological: animes(269, 41467, 53998, 56784, 60636, 1686, 2889, 4835, 8247),
  },
  {
    id: "my-hero-academia",
    name: "My Hero Academia",
    category: "anime",
    chronological: animes(31964, 33486, 36896, 36456, 38408, 39565, 41587, 44200, 49918, 54789),
  },
  {
    id: "re-zero",
    name: "Re:Zero",
    category: "anime",
    chronological: animes(31240, 36286, 38414, 39587, 42203),
  },
  {
    id: "mob-psycho-100",
    name: "Mob Psycho 100",
    category: "anime",
    chronological: animes(32182, 36616, 37510, 50172),
  },
  {
    id: "mushoku-tensei",
    name: "Mushoku Tensei",
    category: "anime",
    chronological: animes(39535, 45576, 50360, 55818, 51179, 55888),
  },
  {
    id: "toaru",
    name: "Toaru (Index / Railgun)",
    category: "anime",
    chronological: animes(4654, 6213, 8937, 16049, 11743, 36432, 38480, 38481),
  },
  {
    id: "ghost-in-the-shell",
    name: "Ghost in the Shell",
    category: "anime",
    chronological: animes(43, 467, 801, 1566, 38799, 41750),
  },
  {
    id: "jojo",
    name: "JoJo's Bizarre Adventure",
    category: "anime",
    chronological: animes(14719, 20899, 26055, 31933, 37991, 48661, 51367, 53273),
  },
  {
    id: "konosuba",
    name: "KonoSuba",
    category: "anime",
    chronological: animes(30831, 32937, 38040, 49458),
  },
  {
    id: "overlord",
    name: "Overlord",
    category: "anime",
    chronological: animes(29803, 35073, 37675, 34161, 34428, 48895),
  },
  {
    id: "shield-hero",
    name: "Shield Hero",
    category: "anime",
    chronological: animes(35790, 40356, 40357),
  },
  {
    id: "tensura",
    name: "Tensei Slime (Tensura)",
    category: "anime",
    chronological: animes(37430, 39551, 41487, 49877, 53580),
  },
  {
    id: "made-in-abyss",
    name: "Made in Abyss",
    category: "anime",
    chronological: animes(34599, 36862, 41084),
  },
  {
    id: "violet-evergarden",
    name: "Violet Evergarden",
    category: "anime",
    chronological: animes(33352, 39741, 37987),
  },
  { id: "k-on", name: "K-On!", category: "anime", chronological: animes(5680, 7791, 9617) },
  {
    id: "psycho-pass",
    name: "Psycho-Pass",
    category: "anime",
    chronological: animes(13601, 23281, 21339, 52747, 39491, 40858),
  },
  {
    id: "tokyo-ghoul",
    name: "Tokyo Ghoul",
    category: "anime",
    chronological: animes(22319, 27899, 36511, 37799),
  },
  {
    id: "chainsaw-man",
    name: "Chainsaw Man",
    category: "anime",
    chronological: animes(44511, 57555),
  },
  {
    id: "spy-x-family",
    name: "Spy x Family",
    category: "anime",
    chronological: animes(50265, 50602, 53887, 53888),
  },
  {
    id: "vinland-saga",
    name: "Vinland Saga",
    category: "anime",
    chronological: animes(37521, 49387),
  },
  {
    id: "dr-stone",
    name: "Dr. Stone",
    category: "anime",
    chronological: animes(38691, 40852, 50612, 48549, 55644, 57592, 61322),
  },
  {
    id: "promised-neverland",
    name: "The Promised Neverland",
    category: "anime",
    chronological: animes(37779, 39617, 47616),
  },
  {
    id: "haikyuu",
    name: "Haikyuu!!",
    category: "anime",
    chronological: animes(20583, 28891, 32935, 38883, 40776, 52742),
  },
  {
    id: "kaguya-sama",
    name: "Kaguya-sama",
    category: "anime",
    chronological: animes(37999, 40591, 43608, 52198),
  },
  {
    id: "bunny-girl-senpai",
    name: "Bunny Girl Senpai",
    category: "anime",
    chronological: animes(37450, 38329, 53129, 54870),
  },
  {
    id: "fruits-basket",
    name: "Fruits Basket",
    category: "anime",
    chronological: animes(38680, 40417, 42938, 49310),
  },
  {
    id: "seven-deadly-sins",
    name: "Seven Deadly Sins",
    category: "anime",
    chronological: animes(23755, 31722, 34577, 35946, 39701, 41491, 46420),
  },
  {
    id: "date-a-live",
    name: "Date A Live",
    category: "anime",
    chronological: animes(15583, 19163, 24655, 36633, 41461, 52196),
  },
  {
    id: "clannad",
    name: "Clannad",
    category: "anime",
    chronological: animes(2167, 4181, 4059, 6351, 1723),
  },
  {
    id: "quintessential-quintuplets",
    name: "5 Novias (Quintuplets)",
    category: "anime",
    chronological: animes(38101, 39783, 48548),
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
