import "server-only";

import { createTranslator } from "next-intl";
import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";
import type { Locale } from "@/i18n/routing";
import { getJikanAiring } from "@/lib/jikan/airing";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTmdbTvLastEpisode } from "@/lib/tmdb/tv";
import { sendPushToUserAdmin } from "./send";

export type NewEpisodesSummary = {
  /** Distinct shows (tv + anime) we checked against their external source. */
  showsChecked: number;
  /** (user, show) notifications fired. */
  notified: number;
  sent: number;
  failed: number;
  pruned: number;
};

const MESSAGES = { es: esMessages, en: enMessages } as const;

function normalizeLocale(locale: string | null | undefined): Locale {
  return locale === "en" ? "en" : "es";
}

type WatchingItem = {
  id: string;
  user_id: string;
  title: string;
  source: string;
  source_id: string;
  kind: string;
};

/** A show that dropped a new episode today, plus the payload bits to render. */
type Fired = {
  members: { userId: string; itemId: string }[];
  title: string;
  source: string;
  sourceId: string;
  kind: "tv" | "anime";
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeName: string | null;
};

/** Today's date (YYYY-MM-DD) in the user's wall-clock zone (Chile). */
function todayInChile(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

/** Current weekday ("Monday"…) in JST, where MAL broadcast days are expressed. */
function weekdayInTokyo(): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * Notifies users about shows they're *watching* that aired a new episode today.
 *
 * - TV (TMDB): fires when `last_episode_to_air.air_date` equals today (Chile).
 *   Exact season/episode is included.
 * - Anime (Jikan/MAL): MAL exposes only a recurring weekly broadcast day (in
 *   JST), not an exact date, so we fire when the show is currently airing and
 *   today (JST) is its broadcast day. No episode number.
 *
 * Shows are deduped across users so each external source is hit once per run.
 * Stateless dedupe-of-notifications: the "today" window + once-a-day schedule
 * means a given episode fires at most once (a missed run loses that day's
 * notice — acceptable for v1; revisit with a notified-episodes table if needed).
 */
export async function dispatchNewEpisodes(): Promise<NewEpisodesSummary> {
  const admin = createServiceRoleClient();
  const empty: NewEpisodesSummary = {
    showsChecked: 0,
    notified: 0,
    sent: 0,
    failed: 0,
    pruned: 0,
  };

  const { data: subs } = await admin.from("push_subscriptions").select("user_id");
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
  if (userIds.length === 0) return empty;

  const { data: items } = await admin
    .from("media_items")
    .select("id, user_id, title, source, source_id, kind")
    .eq("status", "watching")
    .in("kind", ["tv", "anime"])
    .in("user_id", userIds);
  if (!items || items.length === 0) return empty;

  // Group by show so we look each one up exactly once.
  const groups = new Map<string, { sample: WatchingItem; members: WatchingItem[] }>();
  for (const it of items as WatchingItem[]) {
    const key = `${it.kind}:${it.source}:${it.source_id}`;
    const g = groups.get(key);
    if (g) g.members.push(it);
    else groups.set(key, { sample: it, members: [it] });
  }

  const today = todayInChile();
  const tokyoWeekday = weekdayInTokyo().toLowerCase();
  const fired: Fired[] = [];

  for (const { sample, members } of groups.values()) {
    if (sample.kind === "tv") {
      const ep = await getTmdbTvLastEpisode(sample.source_id);
      if (ep?.airDate === today) {
        fired.push({
          members: members.map((m) => ({ userId: m.user_id, itemId: m.id })),
          title: sample.title,
          source: sample.source,
          sourceId: sample.source_id,
          kind: "tv",
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          episodeName: ep.name,
        });
      }
    } else {
      const airing = await getJikanAiring(sample.source_id);
      const day = airing?.broadcastDay?.toLowerCase() ?? "";
      if (airing?.airing && day.startsWith(tokyoWeekday)) {
        fired.push({
          members: members.map((m) => ({ userId: m.user_id, itemId: m.id })),
          title: sample.title,
          source: sample.source,
          sourceId: sample.source_id,
          kind: "anime",
          seasonNumber: null,
          episodeNumber: null,
          episodeName: null,
        });
      }
    }
  }

  // Locale per user (default es).
  const { data: profiles } = await admin.from("profiles").select("id, locale").in("id", userIds);
  const localeByUser = new Map((profiles ?? []).map((p) => [p.id, normalizeLocale(p.locale)]));

  const summary: NewEpisodesSummary = { ...empty, showsChecked: groups.size };

  for (const show of fired) {
    for (const { userId, itemId } of show.members) {
      const locale = localeByUser.get(userId) ?? "es";
      const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "push" });

      let body: string;
      if (show.kind === "anime") {
        body = t("episode.bodyAnime");
      } else if (show.seasonNumber != null && show.episodeNumber != null) {
        const code = `${locale === "en" ? "S" : "T"}${show.seasonNumber}E${show.episodeNumber}`;
        body = show.episodeName
          ? t("episode.bodyTvNamed", { code, name: show.episodeName })
          : t("episode.bodyTv", { code });
      } else {
        body = t("episode.bodyTvUnknown");
      }

      const stats = await sendPushToUserAdmin(userId, {
        title: t("episode.title", { title: show.title }),
        body,
        url: `/library/${itemId}`,
        tag: `episode:${show.kind}:${show.sourceId}`,
      });

      summary.notified += 1;
      summary.sent += stats.sent;
      summary.failed += stats.failed;
      summary.pruned += stats.pruned;
    }
  }

  return summary;
}
