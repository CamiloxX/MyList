"use server";

import { revalidatePath } from "next/cache";
import { safeActionError } from "@/lib/action-error";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_AVATAR_MIME,
  type AllowedAvatarMime,
  MAX_AVATAR_BYTES,
  type UpdateDisplayNameInput,
  type UpdateUsernameInput,
  updateDisplayNameSchema,
  updateUsernameSchema,
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

  if (uploadError) return { ok: false, error: safeActionError("profile.avatar", uploadError) };

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  // Append a cache-busting query so browsers re-fetch after re-upload.
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (updateError) return { ok: false, error: safeActionError("profile.avatar", updateError) };

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

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  if (error) return { ok: false, error: safeActionError("profile.removeAvatar", error) };

  revalidatePath("/settings");
  revalidatePath("/library", "layout");
  return { ok: true, avatarUrl: null };
}

const DISPLAY_NAME_COOLDOWN_DAYS = 30;

export type DisplayNameErrorKey =
  | "notSignedIn"
  | "tooShort"
  | "tooLong"
  | "unchanged"
  | "tooSoon"
  | "failed";

export type UpdateDisplayNameResult =
  | { ok: true; displayName: string; nextChangeAt: string }
  | { ok: false; errorKey: DisplayNameErrorKey; nextChangeAt?: string };

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Updates the user's display name, enforcing a once-every-30-days limit. The
 * real enforcement lives in the DB trigger `profiles_display_name_change_limit`
 * (RLS lets the user update their own row from the client, so the action alone
 * can't be the gate); here we translate the trigger's error into a localized
 * key and keep `auth.users` metadata in sync.
 *
 * The first change (display_name_updated_at IS NULL) is free and just starts
 * the clock.
 */
export async function updateDisplayName(
  input: UpdateDisplayNameInput,
): Promise<UpdateDisplayNameResult> {
  const parsed = updateDisplayNameSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.displayName?.[0];
    return { ok: false, errorKey: first === "tooLong" ? "tooLong" : "tooShort" };
  }
  const displayName = parsed.data.displayName;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "notSignedIn" };

  // Short-circuit no-ops: the trigger treats "same value" as no change and would
  // silently succeed, which would read to the user as a wasted monthly change.
  const { data: current } = await supabase
    .from("profiles")
    .select("display_name, display_name_updated_at")
    .eq("id", user.id)
    .maybeSingle();
  if (current?.display_name === displayName) {
    return { ok: false, errorKey: "unchanged" };
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("display_name_updated_at")
    .single();

  if (error) {
    if (error.message.includes("display_name_change_too_soon")) {
      const nextChangeAt = current?.display_name_updated_at
        ? addDays(current.display_name_updated_at, DISPLAY_NAME_COOLDOWN_DAYS)
        : undefined;
      return { ok: false, errorKey: "tooSoon", nextChangeAt };
    }
    console.warn("[updateDisplayName] error:", error.message);
    return { ok: false, errorKey: "failed" };
  }

  // Keep auth metadata in sync so user_metadata.display_name doesn't drift from
  // the profiles row (greeting, JWT claims, etc. read from metadata elsewhere).
  await supabase.auth.updateUser({ data: { display_name: displayName } });

  revalidatePath("/settings");
  revalidatePath("/library", "layout");

  const nextChangeAt = updated.display_name_updated_at
    ? addDays(updated.display_name_updated_at, DISPLAY_NAME_COOLDOWN_DAYS)
    : addDays(new Date().toISOString(), DISPLAY_NAME_COOLDOWN_DAYS);
  return { ok: true, displayName, nextChangeAt };
}

export type UsernameErrorKey =
  | "notSignedIn"
  | "tooShort"
  | "tooLong"
  | "invalidChars"
  | "taken"
  | "failed";

export type UpdateUsernameResult =
  | { ok: true; username: string }
  | { ok: false; errorKey: UsernameErrorKey };

/**
 * Claims (or changes) the user's public @handle. Validation happens with
 * `updateUsernameSchema` (trim + lowercase + format); the DB partial-unique
 * index on `profiles.username` is the real collision guard — a 23505 unique
 * violation maps to the localized "taken" key. No cooldown here: a handle is
 * lower-stakes than the display name, so re-claims are unrestricted for now.
 */
export async function updateUsername(input: UpdateUsernameInput): Promise<UpdateUsernameResult> {
  const parsed = updateUsernameSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.username?.[0];
    const errorKey: UsernameErrorKey =
      first === "tooLong" ? "tooLong" : first === "invalidChars" ? "invalidChars" : "tooShort";
    return { ok: false, errorKey };
  }
  const username = parsed.data.username;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "notSignedIn" };

  const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);

  if (error) {
    // 23505 = unique_violation → another account already owns this handle.
    if (error.code === "23505") return { ok: false, errorKey: "taken" };
    console.warn("[updateUsername] error:", error.message);
    return { ok: false, errorKey: "failed" };
  }

  revalidatePath("/settings");
  return { ok: true, username };
}

export type SetProfilePublicErrorKey = "notSignedIn" | "needHandleFirst" | "failed";

export type SetProfilePublicResult =
  | { ok: true; isPublic: boolean }
  | { ok: false; errorKey: SetProfilePublicErrorKey };

/**
 * Toggles the opt-in `is_public` flag that gates the /u/<handle> page. Going
 * public requires a handle first (the public URL is keyed by username), so we
 * refuse with "needHandleFirst" when none is set. Turning it off never blocks.
 */
export async function setProfilePublic(isPublic: boolean): Promise<SetProfilePublicResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "notSignedIn" };

  if (isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.username) return { ok: false, errorKey: "needHandleFirst" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_public: isPublic })
    .eq("id", user.id);

  if (error) {
    console.warn("[setProfilePublic] error:", error.message);
    return { ok: false, errorKey: "failed" };
  }

  revalidatePath("/settings");
  return { ok: true, isPublic };
}
