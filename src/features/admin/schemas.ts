import { z } from "zod";

/**
 * Zod schemas + validation constants for the admin badge panel. Kept OUT of the
 * "use server" actions file: a "use server" module may only export async
 * functions, so all value exports (schemas, constants, mime maps) live here.
 */

export const BADGE_NAME_MAX = 60;
export const BADGE_DESCRIPTION_MAX = 200;
export const BADGE_ID_MAX = 50;
export const BADGE_SEASON_MAX = 100;

// A badge icon is small; cap well under the Server Action body limit. The
// client downscales to WebP before upload, so WebP must be allowed; we also
// accept png/jpeg in case a future flow uploads without downscaling.
export const MAX_BADGE_ICON_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_BADGE_ICON_MIME = ["image/webp", "image/png", "image/jpeg"] as const;
export type AllowedBadgeIconMime = (typeof ALLOWED_BADGE_ICON_MIME)[number];

export const BADGE_ICON_EXT: Record<AllowedBadgeIconMime, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const mediaKind = z.enum(["movie", "tv", "anime"]);
const mediaSource = z.enum(["tmdb", "anilist"]);
// Plain z.number() (not z.coerce): the form binds these to numeric inputs
// (RHF valueAsNumber + manual Number() conversions), so input and output types
// stay `number` and the zodResolver type matches useForm's value type.
const counterTarget = z.number().int().min(1).max(100_000);

/**
 * Mirrors the BadgeCriterion union in src/features/badges/types.ts. Stored as
 * the `criterion` jsonb column. The admin form authors `title_completed`,
 * `title_season` and `manual`; the counter variants exist so the built-in
 * badges remain fully editable.
 */
export const badgeCriterionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("watch_entries_count"), target: counterTarget }),
  z.object({ kind: z.literal("media_completed_count"), mediaKind, target: counterTarget }),
  z.object({ kind: z.literal("ratings_count"), target: counterTarget }),
  z.object({ kind: z.literal("unique_genres_count"), target: counterTarget }),
  z.object({ kind: z.literal("unique_decades_count"), target: counterTarget }),
  z.object({ kind: z.literal("same_day_entries"), target: counterTarget }),
  z.object({ kind: z.literal("daily_streak"), target: counterTarget }),
  z.object({
    kind: z.literal("title_season"),
    source: mediaSource,
    sourceId: z.string().trim().min(1),
    mediaKind,
    season: z.number().int().min(1).max(BADGE_SEASON_MAX),
  }),
  z.object({
    kind: z.literal("title_completed"),
    source: mediaSource,
    sourceId: z.string().trim().min(1),
    mediaKind,
    title: z.string().optional(),
  }),
  z.object({
    kind: z.literal("title_episodes"),
    source: z.literal("anilist"),
    sourceId: z.string().trim().min(1),
    episodes: counterTarget,
    title: z.string().optional(),
  }),
  z.object({ kind: z.literal("manual") }),
]);
export type BadgeCriterionInput = z.infer<typeof badgeCriterionSchema>;

export const badgeIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(BADGE_ID_MAX)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "ID inválido (minúsculas, números, - o _)");

export const badgeFormSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre").max(BADGE_NAME_MAX, "Nombre muy largo"),
  description: z
    .string()
    .trim()
    .min(1, "Añade una descripción")
    .max(BADGE_DESCRIPTION_MAX, "Descripción muy larga"),
  tier: z.enum(["bronze", "silver", "gold"]),
  sortOrder: z.number().int().min(0).max(100_000),
  criterion: badgeCriterionSchema,
});
export type BadgeFormInput = z.infer<typeof badgeFormSchema>;

export const createBadgeSchema = badgeFormSchema.extend({ id: badgeIdSchema });
export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;

/**
 * Turns a free-text badge name into a candidate slug for the id field. Drops
 * anything that isn't a-z0-9 (accented chars included) into underscores.
 */
export function slugifyBadgeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, BADGE_ID_MAX);
}
