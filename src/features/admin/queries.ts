import "server-only";

import type { BadgeCriterion, BadgeTier } from "@/features/badges/types";
import { createClient } from "@/lib/supabase/server";

/** A badge row as the admin panel needs it: raw fields + parsed criterion. */
export type AdminBadge = {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  iconKey: string | null;
  iconUrl: string | null;
  i18nKey: string | null;
  criterion: BadgeCriterion;
  sortOrder: number;
  isActive: boolean;
};

const VALID_TIERS: ReadonlySet<string> = new Set(["bronze", "silver", "gold"]);

function asTier(value: string): BadgeTier {
  return VALID_TIERS.has(value) ? (value as BadgeTier) : "bronze";
}

function parseCriterion(raw: unknown): BadgeCriterion {
  if (raw && typeof raw === "object" && "kind" in raw) {
    return raw as BadgeCriterion;
  }
  return { kind: "manual" };
}

/**
 * Every badge (active AND inactive) for the admin panel. RLS returns inactive
 * rows only to admins, so the caller must already be gated. Unlike the public
 * catalog loader, this keeps the raw stored text/criterion (no i18n resolution)
 * because the admin edits the underlying row.
 */
export async function getBadgesForAdmin(): Promise<AdminBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .select("id, name, description, tier, icon_key, icon_url, i18n_key, criterion, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    tier: asTier(row.tier),
    iconKey: row.icon_key,
    iconUrl: row.icon_url,
    i18nKey: row.i18n_key,
    criterion: parseCriterion(row.criterion),
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }));
}
