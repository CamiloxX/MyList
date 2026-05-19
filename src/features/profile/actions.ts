"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_AVATAR_MIME,
  type AllowedAvatarMime,
  MAX_AVATAR_BYTES,
} from "./schemas";

export type ProfileActionResult =
  | { ok: true; avatarUrl: string | null }
  | { ok: false; error: string };

const NOT_SIGNED_IN = "Inicia sesión primero";
const INVALID_DATA = "Datos inválidos";

const EXT_BY_MIME: Record<AllowedAvatarMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Receives a cropped image as FormData (`file` field) and stores it at
 * `avatars/<user_id>/avatar.<ext>` in the `avatars` public bucket. Updates
 * `profiles.avatar_url` to the resulting public URL.
 *
 * Cropping happens client-side; this action only validates and persists.
 */
export async function uploadAvatar(formData: FormData): Promise<ProfileActionResult> {
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return { ok: false, error: INVALID_DATA };
  }

  const mime = file.type;
  if (!ALLOWED_AVATAR_MIME.includes(mime as AllowedAvatarMime)) {
    return { ok: false, error: "Formato no soportado (jpg, png o webp)" };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "La imagen pesa más de 2 MB" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const ext = EXT_BY_MIME[mime as AllowedAvatarMime];
  const path = `${user.id}/avatar.${ext}`;

  // Best-effort cleanup: when switching format (jpg <-> webp), the old file
  // would linger forever. Delete the other known extensions before uploading.
  const otherExts = (Object.values(EXT_BY_MIME) as string[]).filter((e) => e !== ext);
  if (otherExts.length > 0) {
    await supabase.storage.from("avatars").remove(otherExts.map((e) => `${user.id}/avatar.${e}`));
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: mime, cacheControl: "3600" });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  // Append a cache-busting query so browsers re-fetch after re-upload.
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/settings");
  revalidatePath("/library", "layout");
  return { ok: true, avatarUrl: url };
}

export async function removeAvatar(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  await supabase.storage
    .from("avatars")
    .remove(Object.values(EXT_BY_MIME).map((e) => `${user.id}/avatar.${e}`));

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/library", "layout");
  return { ok: true, avatarUrl: null };
}
