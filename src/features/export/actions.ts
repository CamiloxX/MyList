"use server";

import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { type ExportFormat, type ExportPayload, exportContent } from "./format";

export type ExportLibraryResult =
  | {
      ok: true;
      filename: string;
      mimeType: string;
      content: string;
    }
  | { ok: false; error: "notSignedIn" | "queryFailed" };

/**
 * Reads every media_item and watch_entry the current user owns (RLS guarantees
 * scope) and returns the serialized content + filename + mime type so the
 * client can build a Blob and trigger a download.
 *
 * JSON is the recommended format: it's complete and can drive a future import
 * feature. CSV is for spreadsheets. TXT is a human-readable inventory.
 */
export async function exportLibrary(format: ExportFormat): Promise<ExportLibraryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "notSignedIn" };

  const [itemsRes, entriesRes] = await Promise.all([
    supabase
      .from("media_items")
      .select(
        "id, source, source_id, kind, title, original_title, year, runtime_minutes, episode_count, poster_url, status, genres, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("watch_entries")
      .select("id, media_item_id, watched_on, rating, platform, season_number, notes, created_at")
      .eq("user_id", user.id)
      .order("watched_on", { ascending: true }),
  ]);

  if (itemsRes.error || entriesRes.error) {
    console.warn(
      "[exportLibrary] query error:",
      itemsRes.error?.message,
      entriesRes.error?.message,
    );
    return { ok: false, error: "queryFailed" };
  }

  const payload: ExportPayload = {
    exported_at: new Date().toISOString(),
    user_email: user.email ?? null,
    items_count: itemsRes.data?.length ?? 0,
    entries_count: entriesRes.data?.length ?? 0,
    items: itemsRes.data ?? [],
    entries: entriesRes.data ?? [],
  };

  const locale = ((await getLocale()) as Locale) ?? "es";
  const { content, mimeType, extension } = exportContent(
    payload,
    format,
    locale === "en" ? "en" : "es",
  );

  const today = new Date().toISOString().slice(0, 10);
  const filename = `mylist-export-${today}.${extension}`;

  return { ok: true, filename, mimeType, content };
}
