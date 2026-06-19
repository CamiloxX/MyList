// Pre-resolves card data (title, poster, year) for EVERY entry of EVERY curated
// franchise and writes them to src/features/library-v2/curated-franchise-data.ts.
//
// Why: getWatchOrder builds a curated franchise's timeline by fetching each
// entry's details sequentially — anime through Jikan at ~1.1s/entry to respect
// its 60/min limit — so opening a 14-title saga used to stall ~15s before the
// timeline could render. With this data pre-resolved, the curated path does zero
// network calls at request time and renders instantly. The franchise cover on
// the /watch-order index is just the first entry's poster, so this supersedes
// the old covers file.
//
// Re-run with `node scripts/resolve-franchise-data.mjs` whenever curated-
// franchises.ts changes. Reads TMDB_API_KEY from .env.local; anime needs no key.
// Sequential with retry on 429/5xx; ~1.1s gap per anime keeps us under Jikan's
// 60/min (movies hit TMDB, which has no hard limit). Expect a few minutes.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// --- TMDB key from .env.local ------------------------------------------------
function readEnv(name) {
  const txt = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && m[1] === name) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return undefined;
}

const TMDB_API_KEY = readEnv("TMDB_API_KEY");
if (!TMDB_API_KEY) {
  console.error("Missing TMDB_API_KEY in .env.local");
  process.exit(1);
}

// --- Parse every entry of every franchise ------------------------------------
// Each franchise is `id: "..."` then `category: "..."` then
// `chronological: movies(<ids>)` / `animes(<ids>)`. We anchor the id list's
// closing `)` to the franchise object's `}` so a stray `)` in an inline comment
// can't end it early, then strip `// comments` and read the numeric ids.
const src = readFileSync(join(root, "src/features/library-v2/curated-franchises.ts"), "utf8");
const franchiseRe =
  /id:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?(movies|animes|series)\(([\s\S]*?)\)\s*,?\s*\}/g;

const entries = []; // { source, kind, sourceId }
const seen = new Set();
let franchiseCount = 0;
let m;
while ((m = franchiseRe.exec(src)) !== null) {
  franchiseCount++;
  const fn = m[3];
  const source = fn === "animes" ? "anilist" : "tmdb";
  const kind = fn === "animes" ? "anime" : fn === "series" ? "tv" : "movie";
  const ids = m[4].replace(/\/\/[^\n]*/g, "").match(/\d+/g) ?? [];
  for (const id of ids) {
    const key = `${source}:${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ source, kind, sourceId: id });
  }
}
console.log(`Parsed ${franchiseCount} franchises, ${entries.length} unique entries`);
if (franchiseCount < 40 || entries.length < 100) {
  console.error("Parse looks wrong, aborting");
  process.exit(1);
}

// --- Helpers -----------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeMal(url) {
  if (!url) return null;
  return url.replace(/^https?:\/\/myanimelist\.net\//, "https://cdn.myanimelist.net/");
}

function yearFrom(date) {
  if (!date) return null;
  const y = Number.parseInt(String(date).slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText}`);
  }
  throw new Error("retries exhausted");
}

async function tmdbEntry(id) {
  const data = await fetchJson(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=es-ES`,
  );
  return {
    title: data.title ?? data.original_title ?? `#${id}`,
    posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
    year: yearFrom(data.release_date),
  };
}

async function tmdbTvEntry(id) {
  const data = await fetchJson(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&language=es-ES`,
  );
  return {
    title: data.name ?? data.original_name ?? `#${id}`,
    posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
    year: yearFrom(data.first_air_date),
  };
}

async function jikanEntry(id) {
  const { data } = await fetchJson(`https://api.jikan.moe/v4/anime/${id}`);
  const title =
    data.title_english?.trim() || data.title?.trim() || data.title_japanese?.trim() || `MAL #${id}`;
  const raw =
    data.images?.webp?.large_image_url ??
    data.images?.jpg?.large_image_url ??
    data.images?.webp?.image_url ??
    data.images?.jpg?.image_url ??
    null;
  return {
    title,
    posterUrl: normalizeMal(raw),
    year: data.year ?? yearFrom(data.aired?.from),
  };
}

// --- Resolve sequentially ----------------------------------------------------
const out = {};
let done = 0;
for (const e of entries) {
  const key = `${e.source}:${e.kind}:${e.sourceId}`;
  try {
    const data =
      e.kind === "movie"
        ? await tmdbEntry(e.sourceId)
        : e.kind === "tv"
          ? await tmdbTvEntry(e.sourceId)
          : await jikanEntry(e.sourceId);
    out[key] = data;
    done++;
    console.log(`OK  [${done}/${entries.length}] ${key} -> ${data.title}`);
  } catch (err) {
    console.warn(`ERR ${key}: ${err.message}`);
  }
  // Jikan needs pacing; TMDB doesn't.
  if (e.kind === "anime") await sleep(1100);
}

// --- Write the generated module ----------------------------------------------
const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");

const file = `// AUTO-GENERATED by scripts/resolve-franchise-data.mjs — do not edit by hand.
// Card data (title, poster, year) for every entry of every curated franchise,
// keyed by \`\${source}:\${kind}:\${sourceId}\`. Pre-resolved so getWatchOrder and
// the /watch-order index render curated sagas with zero TMDB/Jikan calls at
// request time. Regenerate when curated-franchises.ts changes.

export type CuratedEntryData = { title: string; posterUrl: string | null; year: number | null };

export const FRANCHISE_ENTRY_DATA: Record<string, CuratedEntryData> = {
${body}
};
`;

const dest = join(root, "src/features/library-v2/curated-franchise-data.ts");
writeFileSync(dest, file);
console.log(`\nWrote ${Object.keys(out).length}/${entries.length} entries to ${dest}`);
