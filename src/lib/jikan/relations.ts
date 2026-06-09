import "server-only";

import { z } from "zod";
import { jikanFetch } from "./client";

const relationEntrySchema = z.object({
  mal_id: z.number(),
  type: z.string(),
  name: z.string(),
  url: z.string().optional(),
});
const relationGroupSchema = z.object({
  relation: z.string(),
  entry: z.array(relationEntrySchema).default([]),
});
const relationsResponseSchema = z.object({ data: z.array(relationGroupSchema).default([]) });

export type JikanRelation = { relation: string; malId: number; name: string };

/**
 * Immediate franchise neighbors of an anime (Prequel/Sequel/Side story/...).
 * Only `anime` entries are kept (drops manga/novel). Empty array on any failure
 * — a title with no relations is the common, non-error case.
 */
export async function getJikanAnimeRelations(malId: string | number): Promise<JikanRelation[]> {
  try {
    const raw = await jikanFetch<unknown>(`/anime/${malId}/relations`, { revalidate: 86400 });
    const parsed = relationsResponseSchema.parse(raw);
    return parsed.data.flatMap((group) =>
      group.entry
        .filter((entry) => entry.type === "anime")
        .map((entry) => ({ relation: group.relation, malId: entry.mal_id, name: entry.name })),
    );
  } catch (error) {
    console.warn("[jikan-relations] failed:", error);
    return [];
  }
}

export type FranchiseNode = {
  malId: number;
  relationToParent: string | null;
  parentMalId: number | null;
};

// Bounded so a giant franchise (Fate, Gundam) can't fan out forever. Jikan
// rate-limits at ~3 req/s AND 60 req/min, and the traversal does one relations
// call + one detail call per node, so we keep the cap low and pace ~1 call/s to
// stay under the per-minute ceiling (otherwise cold loads hit 429s).
const MAX_NODES = 14;
const MAX_HOPS = 10;
const REL_DELAY_MS = 1100;

// Relation types that stay inside one franchise's watchable graph. Excludes
// Character/Other/Adaptation which jump to unrelated works or other media.
const FOLLOW = new Set([
  "Prequel",
  "Sequel",
  "Side story",
  "Parent story",
  "Summary",
  "Alternative version",
  "Full story",
  "Spin-off",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Breadth-first walk of the anime franchise graph from a starting title. BFS
 * (not a prequel→sequel chain) so side stories / movies / OVAs are all reached;
 * the `visited` set makes it cycle-immune (MAL has prequel⇄sequel loops). Runs
 * sequentially with a delay to respect Jikan's rate limit. Returns the franchise
 * nodes with their parent edge so callers can order them.
 */
export async function traverseAnimeFranchise(originMalId: number): Promise<FranchiseNode[]> {
  const visited = new Set<number>([originMalId]);
  const queue: Array<{
    malId: number;
    parent: number | null;
    relation: string | null;
    hop: number;
  }> = [{ malId: originMalId, parent: null, relation: null, hop: 0 }];
  const nodes: FranchiseNode[] = [];

  while (queue.length > 0 && nodes.length < MAX_NODES) {
    const cur = queue.shift();
    if (!cur) break;
    nodes.push({ malId: cur.malId, relationToParent: cur.relation, parentMalId: cur.parent });
    if (cur.hop >= MAX_HOPS) continue;

    const rels = await getJikanAnimeRelations(cur.malId);
    await sleep(REL_DELAY_MS);
    for (const r of rels) {
      if (visited.size >= MAX_NODES) break;
      if (!FOLLOW.has(r.relation) || visited.has(r.malId)) continue;
      visited.add(r.malId);
      queue.push({ malId: r.malId, parent: cur.malId, relation: r.relation, hop: cur.hop + 1 });
    }
  }
  return nodes;
}
