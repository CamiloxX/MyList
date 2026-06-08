import { z } from "zod";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedAvatarMime = (typeof ALLOWED_AVATAR_MIME)[number];

export const avatarUploadSchema = z.object({
  blob: z.instanceof(Blob),
  mime: z.enum(ALLOWED_AVATAR_MIME),
});
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 50;

// Error strings double as i18n keys (see settings.profileName.errors.*).
export const updateDisplayNameSchema = z.object({
  displayName: z.string().trim().min(DISPLAY_NAME_MIN, "tooShort").max(DISPLAY_NAME_MAX, "tooLong"),
});
export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
// Lowercase letters, digits and underscore. Length is enforced by min/max so
// the regex itself stays length-agnostic. Mirrors the DB CHECK
// `^[a-z0-9_]{3,20}$` on profiles.username.
export const USERNAME_REGEX = /^[a-z0-9_]+$/;

// Error strings double as i18n keys (see profile.handle.errors.*). The handle
// is trimmed + lowercased before validation so "Pugcini" and " pugcini " match.
export const updateUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(USERNAME_MIN, "tooShort")
    .max(USERNAME_MAX, "tooLong")
    .regex(USERNAME_REGEX, "invalidChars"),
});
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
