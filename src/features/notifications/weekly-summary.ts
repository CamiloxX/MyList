import "server-only";

import { createTranslator } from "next-intl";
import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";
import type { Locale } from "@/i18n/routing";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendPushToUserAdmin } from "./send";

export type WeeklySummary = {
  /** Users with push who had any activity this week (and thus got a push). */
  notified: number;
  sent: number;
  failed: number;
  pruned: number;
};

const MESSAGES = { es: esMessages, en: enMessages } as const;

function normalizeLocale(locale: string | null | undefined): Locale {
  return locale === "en" ? "en" : "es";
}

/** Per-user activity counts for the trailing 7 days. */
type Counts = { views: number; added: number; badges: number };

/**
 * Sends each user a "your week in MyList" push summarizing the last 7 days:
 * how many viewings they logged, how many new titles they added, and how many
 * badges they unlocked. Only users with at least one push subscription AND some
 * activity get a push — we never send "you watched nothing this week".
 *
 * Runs with the service-role client (no user session in cron) and builds the
 * message in each user's own locale via createTranslator (no request context).
 */
export async function dispatchWeeklySummary(): Promise<WeeklySummary> {
  const admin = createServiceRoleClient();
  const empty: WeeklySummary = { notified: 0, sent: 0, failed: 0, pruned: 0 };

  // Who can receive a push at all.
  const { data: subs } = await admin.from("push_subscriptions").select("user_id");
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
  if (userIds.length === 0) return empty;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceTs = since.toISOString();
  const sinceDate = sinceTs.slice(0, 10);

  // Pull the week's raw activity in three bulk queries, then tally per user in
  // JS — cheaper than 3×N per-user count queries.
  const [watchRes, addedRes, badgeRes] = await Promise.all([
    admin
      .from("watch_entries")
      .select("user_id")
      .gte("watched_on", sinceDate)
      .in("user_id", userIds),
    admin.from("media_items").select("user_id").gte("created_at", sinceTs).in("user_id", userIds),
    admin.from("user_badges").select("user_id").gte("earned_at", sinceTs).in("user_id", userIds),
  ]);

  const counts = new Map<string, Counts>();
  const bump = (userId: string, key: keyof Counts) => {
    const c = counts.get(userId) ?? { views: 0, added: 0, badges: 0 };
    c[key] += 1;
    counts.set(userId, c);
  };
  for (const row of watchRes.data ?? []) bump(row.user_id, "views");
  for (const row of addedRes.data ?? []) bump(row.user_id, "added");
  for (const row of badgeRes.data ?? []) bump(row.user_id, "badges");

  // Locale per user (default es).
  const { data: profiles } = await admin.from("profiles").select("id, locale").in("id", userIds);
  const localeByUser = new Map((profiles ?? []).map((p) => [p.id, normalizeLocale(p.locale)]));

  const summary: WeeklySummary = { ...empty };

  for (const userId of userIds) {
    const c = counts.get(userId);
    if (!c || (c.views === 0 && c.added === 0 && c.badges === 0)) continue;

    const locale = localeByUser.get(userId) ?? "es";
    const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "push" });

    const stats = await sendPushToUserAdmin(userId, {
      title: t("weekly.title"),
      body: t("weekly.body", { views: c.views, added: c.added, badges: c.badges }),
      url: "/stats",
      tag: "weekly-summary",
    });

    summary.notified += 1;
    summary.sent += stats.sent;
    summary.failed += stats.failed;
    summary.pruned += stats.pruned;
  }

  return summary;
}
