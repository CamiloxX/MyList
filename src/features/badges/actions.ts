"use server";

import { revalidatePath } from "next/cache";
import { safeActionError } from "@/lib/action-error";
import { createClient } from "@/lib/supabase/server";
import { MAX_FEATURED_BADGES } from "./types";

export type FeaturedActionResult = { ok: true } | { ok: false; error: string };

/**
 * Sets the current user's showcased badges (shown next to their name in comment
 * threads). Caps the count and keeps only ids the user has actually earned, so
 * a tampered client can't feature arbitrary badges. RLS (`profiles_update_own`)
 * + the explicit `.eq("id", user.id)` guarantee a user only edits their own row.
 */
export async function updateFeaturedBadges(badgeIds: string[]): Promise<FeaturedActionResult> {
  if (!Array.isArray(badgeIds)) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión primero" };

  // Dedupe, drop non-strings, cap to the max (preserving order).
  const requested = Array.from(
    new Set(badgeIds.filter((id): id is string => typeof id === "string")),
  ).slice(0, MAX_FEATURED_BADGES);

  // Only allow badges the user actually unlocked. Abort on a read error rather
  // than treating "no rows" as "nothing earned" — that would wipe the selection.
  const { data: earned, error: earnedError } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);
  if (earnedError) return { ok: false, error: safeActionError("badges.featured", earnedError) };
  const earnedSet = new Set((earned ?? []).map((r) => r.badge_id));
  const valid = requested.filter((id) => earnedSet.has(id));

  const { error } = await supabase
    .from("profiles")
    .update({ featured_badge_ids: valid })
    .eq("id", user.id);
  if (error) return { ok: false, error: safeActionError("badges.featured", error) };

  revalidatePath("/settings");
  return { ok: true };
}
