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
  /** Display category — groups the franchise on the watch-order index. */
  category: "movie" | "tv" | "anime";
  /** Recommended watch order (in-universe / story order). */
  chronological: CuratedEntry[];
};

function movies(...ids: number[]): CuratedEntry[] {
  return ids.map((id) => ({ source: "tmdb", kind: "movie", sourceId: String(id) }));
}

/** TV entries by TMDB id (the app's `tmdb`/tv key). */
function series(...ids: number[]): CuratedEntry[] {
  return ids.map((id) => ({ source: "tmdb", kind: "tv", sourceId: String(id) }));
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

  // --- Live-action movie sagas + TV franchises. TMDB ids resolved from the
  // discover-franchises multi-agent workflow via scripts/resolve-tmdb-ids.mjs
  // (matched by title + year, picked by vote count), 2026-06. Regenerate the
  // data file after editing.
  {
    id: "dceu-universo-extendido-de-dc",
    name: "DCEU (Universo Extendido de DC)",
    category: "movie",
    // orden de estreno
    chronological: movies(
      49521,
      209112,
      297761,
      297762,
      141052,
      297802,
      287947,
      495764,
      464052,
      436969,
      436270,
      594767,
      298618,
      565770,
      572802,
    ),
  },
  {
    id: "batman-la-trilogia-de-christopher-nolan",
    name: "Batman: La trilogía de Christopher Nolan",
    category: "movie",
    // orden de estreno
    chronological: movies(272, 155, 49026),
  },
  {
    id: "x-men",
    name: "X-Men",
    category: "movie",
    // orden de estreno
    chronological: movies(
      36657,
      36658,
      36668,
      2080,
      49538,
      76170,
      127585,
      246655,
      263115,
      320288,
      340102,
    ),
  },
  {
    id: "deadpool",
    name: "Deadpool",
    category: "movie",
    // orden de estreno
    chronological: movies(293660, 383498, 533535),
  },
  {
    id: "spider-man-trilogia-de-sam-raimi",
    name: "Spider-Man (trilogía de Sam Raimi)",
    category: "movie",
    // orden de estreno
    chronological: movies(557, 558, 559),
  },
  {
    id: "the-amazing-spider-man-saga-de-marc-webb",
    name: "The Amazing Spider-Man (saga de Marc Webb)",
    category: "movie",
    // orden de estreno
    chronological: movies(1930, 102382),
  },
  {
    id: "spider-man-spider-verse",
    name: "Spider-Man: Spider-Verse",
    category: "movie",
    // orden de estreno
    chronological: movies(324857, 569094),
  },
  {
    id: "venom",
    name: "Venom",
    category: "movie",
    // orden de estreno
    chronological: movies(335983, 580489, 912649),
  },
  {
    id: "harry-potter",
    name: "Harry Potter",
    category: "movie",
    // orden de estreno
    chronological: movies(671, 672, 673, 674, 675, 767, 12444, 12445),
  },
  {
    id: "animales-fantasticos",
    name: "Animales Fantásticos",
    category: "movie",
    // orden de estreno
    chronological: movies(259316, 338952, 338953),
  },
  {
    id: "el-senor-de-los-anillos",
    name: "El Señor de los Anillos",
    category: "movie",
    // orden de estreno
    chronological: movies(120, 121, 122),
  },
  {
    id: "el-hobbit",
    name: "El Hobbit",
    category: "movie",
    // orden de estreno
    chronological: movies(49051, 57158, 122917),
  },
  {
    id: "las-cronicas-de-narnia",
    name: "Las Crónicas de Narnia",
    category: "movie",
    // orden de estreno
    chronological: movies(411, 2454, 10140),
  },
  {
    id: "piratas-del-caribe",
    name: "Piratas del Caribe",
    category: "movie",
    // orden de estreno
    chronological: movies(22, 58, 285, 1865, 166426),
  },
  {
    id: "indiana-jones",
    name: "Indiana Jones",
    category: "movie",
    // orden de estreno
    chronological: movies(85, 87, 89, 217, 335977),
  },
  {
    id: "la-momia-trilogia-de-brendan-fraser",
    name: "La Momia (trilogía de Brendan Fraser)",
    category: "movie",
    // orden de estreno
    chronological: movies(564, 1734, 1735),
  },
  {
    id: "matrix",
    name: "Matrix",
    category: "movie",
    // orden de estreno
    chronological: movies(603, 604, 605, 624860),
  },
  {
    id: "terminator",
    name: "Terminator",
    category: "movie",
    // orden de estreno
    chronological: movies(218, 280, 296, 534, 87101, 290859),
  },
  {
    id: "alien",
    name: "Alien",
    category: "movie",
    // orden de estreno
    chronological: movies(348, 679, 8077, 8078, 70981, 126889, 945961),
  },
  {
    id: "depredador-predator",
    name: "Depredador (Predator)",
    category: "movie",
    // orden de estreno
    chronological: movies(106, 169, 34851, 345940, 766507, 1376434, 1242898),
  },
  {
    id: "mad-max",
    name: "Mad Max",
    category: "movie",
    // orden de estreno
    chronological: movies(9659, 8810, 9355, 76341, 786892),
  },
  {
    id: "el-planeta-de-los-simios-saga-clasica",
    name: "El Planeta de los Simios (saga clásica)",
    category: "movie",
    // orden de estreno
    chronological: movies(871, 1685, 1687, 1688, 1705),
  },
  {
    id: "el-planeta-de-los-simios-nueva-saga",
    name: "El Planeta de los Simios (nueva saga)",
    category: "movie",
    // orden de estreno
    chronological: movies(61791, 119450, 281338, 653346),
  },
  {
    id: "dune-saga-de-denis-villeneuve",
    name: "Dune (saga de Denis Villeneuve)",
    category: "movie",
    // orden de estreno
    chronological: movies(438631, 693134),
  },
  {
    id: "mision-imposible",
    name: "Misión Imposible",
    category: "movie",
    // orden de estreno
    chronological: movies(954, 955, 956, 56292, 177677, 353081, 575264, 575265),
  },
  {
    id: "john-wick",
    name: "John Wick",
    category: "movie",
    // orden de estreno
    chronological: movies(245891, 324552, 458156, 603692),
  },
  {
    id: "rapidos-y-furiosos",
    name: "Rápidos y Furiosos",
    category: "movie",
    // orden de estreno
    chronological: movies(9799, 584, 9615, 13804, 51497, 82992, 168259, 337339, 385128, 385687),
  },
  {
    id: "jason-bourne",
    name: "Jason Bourne",
    category: "movie",
    // orden de estreno
    chronological: movies(2501, 2502, 2503, 49040, 324668),
  },
  {
    id: "james-bond-era-daniel-craig",
    name: "James Bond (era Daniel Craig)",
    category: "movie",
    // orden de estreno (continuidad reiniciada)
    chronological: movies(36557, 10764, 37724, 206647, 370172),
  },
  {
    id: "kingsman",
    name: "Kingsman",
    category: "movie",
    // orden cronológico (The King's Man es precuela)
    chronological: movies(476669, 207703, 343668),
  },
  {
    id: "busqueda-implacable-taken",
    name: "Búsqueda implacable (Taken)",
    category: "movie",
    // orden de estreno
    chronological: movies(8681, 82675, 260346),
  },
  {
    id: "toy-story",
    name: "Toy Story",
    category: "movie",
    // orden de estreno
    chronological: movies(862, 863, 10193, 301528),
  },
  {
    id: "shrek",
    name: "Shrek",
    category: "movie",
    // orden de estreno
    chronological: movies(808, 809, 810, 10192),
  },
  {
    id: "como-entrenar-a-tu-dragon",
    name: "Cómo entrenar a tu dragón",
    category: "movie",
    // orden de estreno
    chronological: movies(10191, 82702, 166428),
  },
  {
    id: "kung-fu-panda",
    name: "Kung Fu Panda",
    category: "movie",
    // orden de estreno
    chronological: movies(9502, 49444, 140300, 1011985),
  },
  {
    id: "madagascar",
    name: "Madagascar",
    category: "movie",
    // orden de estreno
    chronological: movies(953, 10527, 80321),
  },
  {
    id: "mi-villano-favorito",
    name: "Mi Villano Favorito",
    category: "movie",
    // orden de estreno (incluye los spin-off de Minions)
    chronological: movies(20352, 93456, 211672, 324852, 438148, 519182),
  },
  {
    id: "la-era-de-hielo",
    name: "La Era de Hielo",
    category: "movie",
    // orden de estreno
    chronological: movies(425, 950, 8355, 57800, 278154),
  },
  {
    id: "cars",
    name: "Cars",
    category: "movie",
    // orden de estreno
    chronological: movies(920, 49013, 260514),
  },
  {
    id: "el-conjuro-universo-warren",
    name: "El Conjuro (Universo Warren)",
    category: "movie",
    // orden de estreno
    chronological: movies(
      138843,
      250546,
      259693,
      396422,
      439079,
      480414,
      521029,
      423108,
      968051,
      1038392,
    ),
  },
  {
    id: "scream",
    name: "Scream",
    category: "movie",
    // orden de estreno
    chronological: movies(4232, 4233, 4234, 41446, 646385, 934433),
  },
  {
    id: "saw-el-juego-del-miedo",
    name: "Saw (El Juego del Miedo)",
    category: "movie",
    // orden de estreno
    chronological: movies(176, 215, 214, 663, 11917, 22804, 41439, 298250, 602734, 951491),
  },
  {
    id: "halloween",
    name: "Halloween",
    category: "movie",
    // orden de estreno (saga original + reboot 2018)
    chronological: movies(
      948,
      11281,
      10676,
      11357,
      11361,
      10987,
      11675,
      11442,
      424139,
      610253,
      616820,
    ),
  },
  {
    id: "insidious",
    name: "Insidious",
    category: "movie",
    // orden de estreno
    chronological: movies(49018, 91586, 280092, 406563, 614479),
  },
  {
    id: "it",
    name: "It",
    category: "movie",
    // orden de estreno
    chronological: movies(346364, 474350),
  },
  {
    id: "un-lugar-en-silencio",
    name: "Un lugar en silencio",
    category: "movie",
    // orden de estreno
    chronological: movies(447332, 520763, 762441),
  },
  {
    id: "actividad-paranormal",
    name: "Actividad Paranormal",
    category: "movie",
    // orden de estreno
    chronological: movies(23827, 41436, 72571, 82990, 227348, 146301, 609972),
  },
  {
    id: "jurassic-park-jurassic-world",
    name: "Jurassic Park / Jurassic World",
    category: "movie",
    // orden de estreno
    chronological: movies(329, 330, 331, 135397, 351286, 507086),
  },
  {
    id: "transformers",
    name: "Transformers",
    category: "movie",
    // orden de estreno
    chronological: movies(1858, 8373, 38356, 91314, 335988, 424783, 667538),
  },
  {
    id: "rocky-creed",
    name: "Rocky / Creed",
    category: "movie",
    // orden de estreno
    chronological: movies(1366, 1367, 1371, 1374, 1375, 1246, 312221, 480530, 677179),
  },
  {
    id: "volver-al-futuro",
    name: "Volver al Futuro",
    category: "movie",
    // orden de estreno (cronológico)
    chronological: movies(105, 165, 196),
  },
  {
    id: "el-padrino",
    name: "El Padrino",
    category: "movie",
    // orden de estreno
    chronological: movies(238, 240, 242),
  },
  {
    id: "los-juegos-del-hambre",
    name: "Los Juegos del Hambre",
    category: "movie",
    // orden de estreno
    chronological: movies(70160, 101299, 131631, 131634, 695721),
  },
  {
    id: "maze-runner",
    name: "Maze Runner",
    category: "movie",
    // orden de estreno (cronológico)
    chronological: movies(198663, 294254, 336843),
  },
  {
    id: "crepusculo",
    name: "Crepúsculo",
    category: "movie",
    // orden de estreno (cronológico)
    chronological: movies(8966, 18239, 24021, 50619, 50620),
  },
  {
    id: "breaking-bad",
    name: "Breaking Bad",
    category: "tv",
    // orden de estreno (la precuela Better Call Saul se disfruta mejor tras la serie original)
    chronological: series(1396, 60059),
  },
  {
    id: "juego-de-tronos",
    name: "Juego de Tronos",
    category: "tv",
    // orden de estreno
    chronological: series(1399, 94997),
  },
  {
    id: "the-walking-dead",
    name: "The Walking Dead",
    category: "tv",
    // orden de estreno
    chronological: series(1402, 62286, 94305, 136248, 194583, 211684, 206586),
  },
  {
    id: "yellowstone",
    name: "Yellowstone",
    category: "tv",
    // orden de estreno
    chronological: series(73586, 118357, 157744),
  },
  {
    id: "vikingos",
    name: "Vikingos",
    category: "tv",
    // orden de estreno (Valhalla transcurre ~100 años después)
    chronological: series(44217, 116135),
  },
  {
    id: "dexter",
    name: "Dexter",
    category: "tv",
    // orden de estreno (la precuela Original Sin se ubica en 1991, antes de la serie original)
    chronological: series(1405, 131927, 219937, 259909),
  },
  {
    id: "universo-star-trek-era-moderna",
    name: "Universo Star Trek (era moderna)",
    category: "tv",
    // orden de estreno de las series modernas
    chronological: series(67198, 85949, 85948, 106393, 103516),
  },
  {
    id: "avatar",
    name: "Avatar",
    category: "tv",
    // orden cronológico (secuela)
    chronological: series(246, 33880),
  },
  {
    id: "the-witcher",
    name: "The Witcher",
    category: "tv",
    // orden de estreno (la precuela El origen de la sangre salió después)
    chronological: series(71912, 106541),
  },
  {
    id: "star-wars-series-de-accion-real",
    name: "Star Wars (series de acción real)",
    category: "tv",
    // orden de estreno
    chronological: series(82856, 115036, 92830, 83867, 114461),
  },
  {
    id: "stargate",
    name: "Stargate",
    category: "tv",
    // orden de estreno
    chronological: series(4629, 2290, 5148),
  },
  {
    id: "arrowverse",
    name: "Arrowverse",
    category: "tv",
    // orden de estreno
    chronological: series(1412, 60735, 62688, 62643, 89247),
  },
  {
    id: "the-boys-universo",
    name: "The Boys (universo)",
    category: "tv",
    // orden de estreno
    chronological: series(76479, 205715),
  },
  {
    id: "marvel-los-defensores-netflix",
    name: "Marvel / Los Defensores (Netflix)",
    category: "tv",
    // orden de estreno
    chronological: series(61889, 38472, 62126, 62127, 62285, 67178),
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
