import "server-only";

import { getTranslations } from "next-intl/server";
import type { createClient } from "@/lib/supabase/server";
import type { BadgeCriterion, BadgeDefinition, BadgeTier } from "./types";

/**
 * The badge catalog lives in the `public.badges` table (DB-driven so admins can
 * add custom badges). This module loads it and resolves each badge's display
 * text: built-in badges carry an `i18n_key` and prefer the next-intl
 * translation; admin-created badges fall back to the `name`/`description`
 * columns. Server-only — never import from a Client Component.
 */

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type Translator = Awaited<ReturnType<typeof getTranslations>>;

type BadgeRow = {
  id: string;
  name: string;
  description: string;
  i18n_key: string | null;
  icon_key: string | null;
  icon_url: string | null;
  tier: string;
  criterion: unknown;
  sort_order: number;
  is_active: boolean;
};

const BADGE_COLUMNS =
  "id, name, description, i18n_key, icon_key, icon_url, tier, criterion, sort_order, is_active";

const VALID_TIERS: ReadonlySet<string> = new Set(["bronze", "silver", "gold"]);

function asTier(value: string): BadgeTier {
  return VALID_TIERS.has(value) ? (value as BadgeTier) : "bronze";
}

/**
 * The `criterion` column is written only by our own admin actions and the seed,
 * so the stored shape is trusted to match BadgeCriterion. Anything malformed
 * degrades to a `manual` badge (never auto-granted) rather than throwing.
 */
function parseCriterion(raw: unknown): BadgeCriterion {
  if (raw && typeof raw === "object" && "kind" in raw) {
    return raw as BadgeCriterion;
  }
  return { kind: "manual" };
}

function resolveText(
  t: Translator | null,
  row: BadgeRow,
): { name: string; description: string } {
  // Only built-ins carry an i18n_key; those entries always exist in messages,
  // so the `.has` check is just defensive for partial translation files.
  if (t && row.i18n_key && (t.has?.(`items.${row.i18n_key}.name`) ?? true)) {
    return {
      name: t(`items.${row.i18n_key}.name`),
      description: t(`items.${row.i18n_key}.description`),
    };
  }
  return { name: row.name, description: row.description };
}

function toDefinition(t: Translator | null, row: BadgeRow): BadgeDefinition {
  const { name, description } = resolveText(t, row);
  return {
    id: row.id,
    criterion: parseCriterion(row.criterion),
    iconKey: row.icon_key,
    iconUrl: row.icon_url,
    name,
    description,
    tier: asTier(row.tier),
  };
}

async function safeTranslator(): Promise<Translator | null> {
  // getTranslations needs request/locale context; outside it (e.g. a cron job)
  // it throws. Fall back to the DB text in that case.
  try {
    return await getTranslations("badges");
  } catch {
    return null;
  }
}

/** Every active badge, ordered for display, with text + icons resolved. */
export async function loadBadgeCatalog(supabase: ServerClient): Promise<BadgeDefinition[]> {
  const [res, t] = await Promise.all([
    supabase.from("badges").select(BADGE_COLUMNS).order("sort_order", { ascending: true }),
    safeTranslator(),
  ]);
  if (res.error || !res.data) return [];
  return res.data.map((row) => toDefinition(t, row as unknown as BadgeRow));
}

/** Same as loadBadgeCatalog, keyed by id for O(1) lookup. */
export async function loadBadgeMap(supabase: ServerClient): Promise<Map<string, BadgeDefinition>> {
  const list = await loadBadgeCatalog(supabase);
  return new Map(list.map((badge) => [badge.id, badge]));
}
