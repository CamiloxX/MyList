import "server-only";

import { z } from "zod";
import {
  computeStreaks,
  getTopOfYearForUser,
  type KindHours,
  type TopRatedItem,
} from "@/features/stats/queries";
import { yearRange } from "@/lib/dates";
import { genreLabel } from "@/lib/genres";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type WrappedClient = Awaited<ReturnType<typeof createClient>>;

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export type WrappedData = {
  year: number;
  /** Distinct titles with at least one viewing in the year. */
  totalTitles: number;
  totalEntries: number;
  totalHours: number;
  hoursByKind: KindHours;
  topGenre: string | null;
  topRated: TopRatedItem[];
  mostActiveMonth: { index: number; entries: number } | null;
  /** Longest run of consecutive watch days inside the year. */
  longestStreak: number;
};

/**
 * Aggregates one calendar year of viewing into the Wrapped summary. Injectable
 * client (`*ForUser` pattern) so the public share route can run it with the
 * service-role client for an arbitrary user. Returns null for empty years.
 */
export async function getWrappedForUser(
  client: WrappedClient,
  userId: string,
  year: number,
  locale: "es" | "en",
): Promise<WrappedData | null> {
  const range = yearRange(year);
  type Row = {
    watched_on: string;
    media_item_id: string;
    media_items: {
      kind: "movie" | "tv" | "anime";
      runtime_minutes: number | null;
      genres: unknown;
    };
  };
  const rows = await fetchAllRows<Row>(
    (from, to) =>
      client
        .from("watch_entries")
        .select(`watched_on, media_item_id, media_items!inner ( kind, runtime_minutes, genres )`)
        .eq("user_id", userId)
        .gte("watched_on", range.start)
        .lt("watched_on", range.endExclusive)
        .order("watched_on")
        .range(from, to) as unknown as PromiseLike<{
        data: Row[] | null;
        error: { message: string } | null;
      }>,
  );
  if (rows.length === 0) return null;

  const minutesByKind: KindHours = { movie: 0, tv: 0, anime: 0 };
  const genreCounts = new Map<string, number>();
  const monthCounts = Array.from({ length: 12 }, () => 0);
  const titleIds = new Set<string>();
  const watchDates = new Set<string>();
  let totalMinutes = 0;

  for (const row of rows) {
    const media = row.media_items;
    const minutes =
      media.runtime_minutes ?? (media.kind === "tv" || media.kind === "anime" ? 22 : 0);
    minutesByKind[media.kind] += minutes;
    totalMinutes += minutes;
    titleIds.add(row.media_item_id);
    watchDates.add(row.watched_on);

    const month = Number.parseInt(row.watched_on.slice(5, 7), 10) - 1;
    if (month >= 0 && month <= 11) monthCounts[month] = (monthCounts[month] ?? 0) + 1;

    const genres = Array.isArray(media.genres) ? (media.genres as Array<string | number>) : [];
    const seen = new Set<string>();
    for (const raw of genres) {
      const label = genreLabel(raw, locale);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
    }
  }

  let mostActiveMonth: WrappedData["mostActiveMonth"] = null;
  for (let index = 0; index < 12; index++) {
    const entries = monthCounts[index] ?? 0;
    if (entries > 0 && (!mostActiveMonth || entries > mostActiveMonth.entries)) {
      mostActiveMonth = { index, entries };
    }
  }

  const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;
  // "today" outside the year keeps the current-streak logic inert; we only
  // want the longest run inside the year.
  const { longest } = computeStreaks(watchDates, `${year}-12-31`);
  const topRated = await getTopOfYearForUser(client, userId, year, 3);

  return {
    year,
    totalTitles: titleIds.size,
    totalEntries: rows.length,
    totalHours: toHours(totalMinutes),
    hoursByKind: {
      movie: toHours(minutesByKind.movie),
      tv: toHours(minutesByKind.tv),
      anime: toHours(minutesByKind.anime),
    },
    topGenre: [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    topRated,
    mostActiveMonth,
    longestStreak: longest,
  };
}

/** Authed wrapper: the current user's Wrapped for a year. */
export async function getWrapped(year: number, locale: "es" | "en"): Promise<WrappedData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getWrappedForUser(supabase, user?.id ?? NIL_UUID, year, locale);
}

/** The current user's share row id for a year, if the Wrapped is shared. */
export async function getWrappedShareId(year: number): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("wrapped_shares")
    .select("id")
    .eq("user_id", user.id)
    .eq("year", year)
    .maybeSingle();
  return data?.id ?? null;
}

export type SharedWrapped = {
  wrapped: WrappedData;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Public read of a shared Wrapped by capability link. Service-role bypasses
 * RLS but ONLY after the share row proves the owner published it; exposes
 * display fields only — never the email. Returns null for unknown ids.
 */
export async function getSharedWrapped(
  shareId: string,
  locale: "es" | "en",
): Promise<SharedWrapped | null> {
  if (!z.string().uuid().safeParse(shareId).success) return null;

  const admin = createServiceRoleClient();
  const { data: share } = await admin
    .from("wrapped_shares")
    .select("user_id, year")
    .eq("id", shareId)
    .maybeSingle();
  if (!share) return null;

  const wrapped = await getWrappedForUser(admin, share.user_id, share.year, locale);
  if (!wrapped) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", share.user_id)
    .maybeSingle();

  return {
    wrapped,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}
