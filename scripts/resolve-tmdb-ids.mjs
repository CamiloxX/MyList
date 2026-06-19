// Resolves TMDB ids for the franchises discovered by the discover-franchises
// workflow. The agents return only {title, year} per entry (LLMs hallucinate
// ids, so we never trust those); this script searches the TMDB API by title +
// year to get the canonical id, picking the result whose year matches. It then
// emits a ready-to-paste curated-franchises.ts snippet and a confidence report.
//
// Usage: node scripts/resolve-tmdb-ids.mjs [draft.json]
//   draft.json = { franchises: [{ name, category: "movie"|"tv", note?, entries: [{title, year}] }] }
// Writes the snippet to scripts/_new-franchises.snippet.ts and prints a report.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

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

const draftPath = process.argv[2] ?? join(root, "franchises-draft.json");
const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const franchises = draft.franchises ?? [];
console.log(`Loaded ${franchises.length} franchises from ${draftPath}`);

// Existing ids — avoid slug collisions.
const existingSrc = readFileSync(join(root, "src/features/library-v2/curated-franchises.ts"), "utf8");
const existingIds = new Set([...existingSrc.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base) {
  let slug = base || "franchise";
  let i = 2;
  while (existingIds.has(slug)) slug = `${base}-${i++}`;
  existingIds.add(slug);
  return slug;
}

async function search(category, title, year) {
  const kind = category === "tv" ? "tv" : "movie";
  const yearParam = kind === "tv" ? "first_air_date_year" : "year";
  const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "es-ES");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("query", decodeEntities(title));
  if (year) url.searchParams.set(yearParam, String(year));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url.toString());
    if (res.ok) return (await res.json()).results ?? [];
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText}`);
  }
  throw new Error("retries exhausted");
}

const yearOf = (r) => {
  const d = r.release_date || r.first_air_date;
  return d ? Number(d.slice(0, 4)) : null;
};

// Among results matching the requested year, prefer the most-voted (the main
// film/series), not just the first — otherwise same-year documentaries, webcasts
// or extras (identical title, ~0 votes) can win. Falls back to nearest year,
// then most popular overall (low confidence).
function pick(results, year) {
  if (!results.length) return { match: null, confidence: "none" };
  const byVotes = (a, b) =>
    (b.vote_count || 0) - (a.vote_count || 0) || (b.popularity || 0) - (a.popularity || 0);
  const exact = results.filter((r) => yearOf(r) === year);
  if (exact.length) return { match: exact.sort(byVotes)[0], confidence: "exact" };
  const near = results.filter((r) => {
    const y = yearOf(r);
    return y != null && Math.abs(y - year) <= 1;
  });
  if (near.length) return { match: near.sort(byVotes)[0], confidence: "near" };
  const popular = [...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return { match: popular[0], confidence: "low" };
}

const report = [];
const blocks = [];

for (const f of franchises) {
  const ids = [];
  for (const e of f.entries) {
    try {
      const results = await search(f.category, e.title, e.year);
      const { match, confidence } = pick(results, e.year);
      if (!match) {
        report.push(`  NOT FOUND  ${f.name} :: ${e.title} (${e.year})`);
        continue;
      }
      const title = match.title || match.name;
      const gotYear = yearOf(match);
      ids.push(match.id);
      if (confidence === "low") {
        report.push(
          `  LOW CONF   ${f.name} :: "${e.title}" (${e.year}) -> #${match.id} "${title}" (${gotYear})`,
        );
      }
    } catch (err) {
      report.push(`  ERROR      ${f.name} :: ${e.title}: ${err.message}`);
    }
    await sleep(120);
  }
  if (ids.length < 2) {
    report.push(`  SKIPPED    ${f.name}: only ${ids.length} id(s) resolved`);
    continue;
  }
  const fn = f.category === "tv" ? "series" : "movies";
  const cleanName = decodeEntities(f.name);
  const slug = uniqueSlug(slugify(cleanName));
  const note = f.note ? `    // ${f.note}\n` : "";
  blocks.push(
    `  {\n    id: ${JSON.stringify(slug)},\n    name: ${JSON.stringify(cleanName)},\n    category: ${JSON.stringify(f.category)},\n${note}    chronological: ${fn}(${ids.join(", ")}),\n  },`,
  );
}

const snippet = `${blocks.join("\n")}\n`;
const dest = join(root, "scripts/_new-franchises.snippet.ts");
writeFileSync(dest, snippet);

console.log(`\n=== ${blocks.length} franchises written to ${dest} ===`);
console.log(`\n=== REPORT (${report.length} notes) ===`);
console.log(report.length ? report.join("\n") : "  all entries matched cleanly");
