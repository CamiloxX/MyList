"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const yearSchema = z.number().int().min(1900).max(2200);

export type WrappedShareResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: "notSignedIn" | "invalidYear" | "failed" };

/** Publishes (or re-uses) the share link for the user's Wrapped of a year. */
export async function createWrappedShare(rawYear: number): Promise<WrappedShareResult> {
  const year = yearSchema.safeParse(rawYear);
  if (!year.success) return { ok: false, error: "invalidYear" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "notSignedIn" };

  const { data, error } = await supabase
    .from("wrapped_shares")
    .upsert({ user_id: user.id, year: year.data }, { onConflict: "user_id,year" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "failed" };
  return { ok: true, data: { id: data.id } };
}

/** Revokes the share link (deletes the capability row → public page 404s). */
export async function revokeWrappedShare(
  rawYear: number,
): Promise<{ ok: true } | { ok: false; error: "notSignedIn" | "invalidYear" | "failed" }> {
  const year = yearSchema.safeParse(rawYear);
  if (!year.success) return { ok: false, error: "invalidYear" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "notSignedIn" };

  const { error } = await supabase
    .from("wrapped_shares")
    .delete()
    .eq("user_id", user.id)
    .eq("year", year.data);
  if (error) return { ok: false, error: "failed" };
  return { ok: true };
}
