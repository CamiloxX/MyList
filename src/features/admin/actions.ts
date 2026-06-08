"use server";

import { revalidatePath } from "next/cache";
import { searchTmdb, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";
import { tmdbImage } from "@/lib/tmdb/client";
import { getTmdbTvSummary } from "@/lib/tmdb/tv";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import {
  ALLOWED_BADGE_ICON_MIME,
  type AllowedBadgeIconMime,
  BADGE_ICON_EXT,
  badgeFormSchema,
  badgeIdSchema,
  type CreateBadgeInput,
  createBadgeSchema,
  type BadgeFormInput,
  MAX_BADGE_ICON_BYTES,
} from "./schemas";

export type AdminActionResult = { ok: true } | { ok: false; error: string };
export type AdminActionResultWith<T> = { ok: true; data: T } | { ok: false; error: string };

const NOT_SIGNED_IN = "Inicia sesión primero";
const NOT_AUTHORIZED = "No autorizado";
const INVALID_DATA = "Datos inválidos";

/**
 * Server-side admin gate (Result-style) reused by every mutation here. The
 * badges RLS policies already require is_admin, but checking explicitly turns a
 * silent "0 rows affected" into a clean "No autorizado".
 */
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, error: NOT_AUTHORIZED };

  return { ok: true, userId: user.id };
}

export async function createBadge(
  input: CreateBadgeInput,
): Promise<AdminActionResultWith<{ id: string }>> {
  const parsed = createBadgeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID_DATA };
  }
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .insert({
      id: parsed.data.id,
      name: parsed.data.name,
      description: parsed.data.description,
      tier: parsed.data.tier,
      criterion: parsed.data.criterion as unknown as Json,
      sort_order: parsed.data.sortOrder,
    })
    .select("id")
    .single();
  if (error || !data) {
    // 23505 = unique_violation (duplicate id)
    if (error?.code === "23505") return { ok: false, error: "Ya existe un logro con ese ID" };
    return { ok: false, error: error?.message ?? INVALID_DATA };
  }

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true, data: { id: data.id } };
}

export async function updateBadge(id: string, input: BadgeFormInput): Promise<AdminActionResult> {
  if (!badgeIdSchema.safeParse(id).success) return { ok: false, error: INVALID_DATA };
  const parsed = badgeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID_DATA };
  }
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const { error } = await supabase
    .from("badges")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      tier: parsed.data.tier,
      criterion: parsed.data.criterion as unknown as Json,
      sort_order: parsed.data.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true };
}

export async function toggleBadgeActive(id: string, isActive: boolean): Promise<AdminActionResult> {
  if (!badgeIdSchema.safeParse(id).success || typeof isActive !== "boolean") {
    return { ok: false, error: INVALID_DATA };
  }
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const { error } = await supabase
    .from("badges")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true };
}

export async function deleteBadge(id: string): Promise<AdminActionResult> {
  if (!badgeIdSchema.safeParse(id).success) return { ok: false, error: INVALID_DATA };
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  // Drop any uploaded icon first (best-effort); the row delete cascades to
  // user_badges via the FK.
  await supabase.storage
    .from("badge-icons")
    .remove(Object.values(BADGE_ICON_EXT).map((ext) => `${id}.${ext}`));

  const { error } = await supabase.from("badges").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true };
}

/**
 * Uploads a custom icon (WebP, downscaled client-side) to the `badge-icons`
 * bucket at `<badgeId>.<ext>` and points badges.icon_url at it (clearing any
 * Lucide icon_key). The badge must already exist.
 */
export async function uploadBadgeIcon(
  badgeId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!badgeIdSchema.safeParse(badgeId).success) return { ok: false, error: INVALID_DATA };

  const file = formData.get("file");
  if (!(file instanceof Blob)) return { ok: false, error: INVALID_DATA };
  const mime = file.type;
  if (!ALLOWED_BADGE_ICON_MIME.includes(mime as AllowedBadgeIconMime)) {
    return { ok: false, error: "Formato no soportado (png, jpg o webp)" };
  }
  if (file.size > MAX_BADGE_ICON_BYTES) {
    return { ok: false, error: "La imagen es demasiado grande (máx 1 MB)" };
  }

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const ext = BADGE_ICON_EXT[mime as AllowedBadgeIconMime];
  const path = `${badgeId}.${ext}`;

  // Clear other formats so a png→webp switch doesn't leave a stale file behind.
  const others = (Object.values(BADGE_ICON_EXT) as string[]).filter((e) => e !== ext);
  if (others.length > 0) {
    await supabase.storage.from("badge-icons").remove(others.map((e) => `${badgeId}.${e}`));
  }

  const { error: uploadError } = await supabase.storage
    .from("badge-icons")
    .upload(path, file, { upsert: true, contentType: mime, cacheControl: "3600" });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from("badge-icons").getPublicUrl(path);
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("badges")
    .update({ icon_url: url, icon_key: null, updated_at: new Date().toISOString() })
    .eq("id", badgeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true };
}

export async function removeBadgeIcon(badgeId: string): Promise<AdminActionResult> {
  if (!badgeIdSchema.safeParse(badgeId).success) return { ok: false, error: INVALID_DATA };
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  await supabase.storage
    .from("badge-icons")
    .remove(Object.values(BADGE_ICON_EXT).map((ext) => `${badgeId}.${ext}`));
  const { error } = await supabase
    .from("badges")
    .update({ icon_url: null, updated_at: new Date().toISOString() })
    .eq("id", badgeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/badges");
  return { ok: true };
}

export type BadgeSeriesResult = {
  source: "tmdb";
  sourceId: string;
  mediaKind: "tv";
  title: string;
  year: number | null;
  posterUrl: string | null;
};

/**
 * Title search for the `title_season` condition. Only TMDB series are returned:
 * season tracking only exists for TMDB tv (movies have no seasons; anime via
 * Jikan never records a season_number), so other kinds could never auto-unlock.
 */
export async function searchSeriesForBadge(query: string): Promise<BadgeSeriesResult[]> {
  const admin = await requireAdmin();
  if (!admin.ok) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const results = await searchTmdb(q);
    return results
      .filter((item) => item.media_type === "tv")
      .slice(0, 8)
      .map((item) => ({
        source: "tmdb" as const,
        sourceId: String(item.id),
        mediaKind: "tv" as const,
        title: tmdbTitle(item),
        year: tmdbYear(item),
        posterUrl: tmdbImage(item.poster_path, "w92"),
      }));
  } catch {
    return [];
  }
}

export type BadgeSeasonOption = { season: number; name: string };
export type BadgeSeriesDetail = { title: string | null; seasons: BadgeSeasonOption[] };

/**
 * Series title + seasons for the `title_season` picker. The title lets the edit
 * view show the chosen series by name instead of its numeric id.
 */
export async function getSeriesSeasonsForBadge(sourceId: string): Promise<BadgeSeriesDetail> {
  const admin = await requireAdmin();
  if (!admin.ok) return { title: null, seasons: [] };
  if (!sourceId.trim()) return { title: null, seasons: [] };
  const detail = await getTmdbTvSummary(sourceId);
  if (!detail) return { title: null, seasons: [] };
  return {
    title: detail.name,
    seasons: detail.seasons.map((s) => ({ season: s.season_number, name: s.name })),
  };
}
