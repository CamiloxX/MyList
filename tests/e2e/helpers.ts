import { createClient } from "@supabase/supabase-js";

/**
 * Test-only service-role helpers. This module NEVER runs inside the app —
 * Playwright imports it in the Node test runner to seed/clean the dedicated
 * e2e account's data (RLS keeps that account isolated from real users).
 */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars — run tests via playwright.config.ts");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function e2eUserId(): Promise<string> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email === process.env.E2E_EMAIL);
  if (!user) throw new Error("e2e user not found — run scripts/create-e2e-user.mjs");
  return user.id;
}

/** Self-healing cleanup: wipes the e2e account's library before each spec. */
export async function clearLibrary(userId: string): Promise<void> {
  const admin = adminClient();
  const entries = await admin.from("watch_entries").delete().eq("user_id", userId);
  if (entries.error) throw entries.error;
  const items = await admin.from("media_items").delete().eq("user_id", userId);
  if (items.error) throw items.error;
}

/** Seeds one known movie so detail-page specs have stable data. */
export async function seedInterstellar(userId: string): Promise<string> {
  const admin = adminClient();
  const { data, error } = await admin
    .from("media_items")
    .insert({
      user_id: userId,
      source: "tmdb",
      source_id: "157336",
      kind: "movie",
      title: "Interstellar",
      original_title: "Interstellar",
      year: 2014,
      runtime_minutes: 169,
      genres: [],
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
