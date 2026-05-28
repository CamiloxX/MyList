import "server-only";

import { getTranslations } from "next-intl/server";
import { sendPushToUser } from "@/features/notifications";
import type { BadgeDefinition } from "./types";

/**
 * Fans newly-earned badges out to the user's push subscriptions. Best-effort:
 * any failure (no locale context, no subs, push not configured) is swallowed
 * — the toast in-app is still the canonical celebration.
 *
 * For a single badge we send one detailed notification; for two or more we
 * collapse into a single "N nuevos logros" line so the device doesn't spam.
 */
export async function pushNewBadges(
  userId: string,
  badges: BadgeDefinition[],
): Promise<void> {
  if (badges.length === 0) return;
  try {
    const tBadges = await getTranslations("badges");
    if (badges.length === 1) {
      const b = badges[0];
      if (!b) return;
      const name = tBadges(`items.${b.i18nKey}.name`);
      const description = tBadges(`items.${b.i18nKey}.description`);
      await sendPushToUser(userId, {
        title: tBadges("toast.unlocked"),
        body: `${name} — ${description}`,
        url: "/badges",
        tag: `badge:${b.id}`,
      });
      return;
    }
    const names = badges
      .slice(0, 3)
      .map((b) => tBadges(`items.${b.i18nKey}.name`))
      .join(", ");
    const extra = badges.length > 3 ? ` +${badges.length - 3}` : "";
    await sendPushToUser(userId, {
      title: tBadges("toast.unlocked"),
      body: `${names}${extra}`,
      url: "/badges",
      tag: "badge:batch",
    });
  } catch (err) {
    console.warn("[badges] push notify failed", err);
  }
}
