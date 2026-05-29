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
