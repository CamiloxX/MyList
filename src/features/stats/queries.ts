import "server-only";

import { yearMonthRange, yearRange } from "@/lib/dates";
import { genreLabel } from "@/lib/genres";
import { createClient } from "@/lib/supabase/server";

/**
 * Injected Supabase client — the authed cookie client OR the service-role
 * client (structurally identical). The `*ForUser` cores accept one so the
 * public profile page can run the same aggregates for an arbitrary user via
 * service-role; that path MUST pass an explicit userId (RLS is bypassed there).
 */
type StatsClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Stand-in user id for the no-session case (unreachable in practice — stats
 * pages are auth-gated). A syntactically valid uuid that matches no row, so the
 * authed wrappers degrade to empty results instead of querying without a filter.
 */
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export type MonthEntry = {
  id: string;
  watched_on: string;
  rating: number | null;
  platform: string | null;
  notes: string | null;
  media_item_id: string;
  title: string;
  poster_url: string | null;
  kind: "movie" | "tv" | "anime";
  year: number | null;
  runtime_minutes: number | null;
};

export type MonthSummary = {
  yearMonth: string;
  totalEntries: number;
  totalHours: number;
  entriesByDate: Map<string, MonthEntry[]>;
};

/**
 * Fetch all watch_entries within a given year-month (YYYY-MM) for the current user,
 * joined with the parent media_item for display.
 */
export async function getMonthEntries(yearMonth: string): Promise<MonthSummary | null> {
  const range = yearMonthRange(yearMonth);
  if (!range) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_entries")
    .select(
      `id, watched_on, rating, platform, notes, media_item_id,
       media_items!inner ( title, poster_url, kind, year, runtime_minutes )`,
    )
    .gte("watched_on", range.start)
    .lt("watched_on", range.endExclusive)
    .order("watched_on", { ascending: false });

  if (error) {
    throw new Error(`Error cargando vista mensual: ${error.message}`);
  }

  const entries: MonthEntry[] = (data ?? []).map((row) => {
    // Supabase types the join as a single object due to !inner; cast safely.
    const media = row.media_items as unknown as {
      title: string;
      poster_url: string | null;
      kind: "movie" | "tv" | "anime";
      year: number | null;
      runtime_minutes: number | null;
    };
    return {
      id: row.id,
      watched_on: row.watched_on,
      rating: row.rating,
      platform: row.platform,
      notes: row.notes,
      media_item_id: row.media_item_id,
      title: media.title,
      poster_url: media.poster_url,
      kind: media.kind,
      year: media.year,
      runtime_minutes: media.runtime_minutes,
    };
  });

  const entriesByDate = new Map<string, MonthEntry[]>();
  let totalMinutes = 0;
  for (const entry of entries) {
    const bucket = entriesByDate.get(entry.watched_on);
    if (bucket) {
      bucket.push(entry);
    } else {
      entriesByDate.set(entry.watched_on, [entry]);
    }
    // Conservative hours estimate: movie runtime as-is; TV/anime fallback to 22 min
    // per episode (we don't know how many episodes per visualization yet).
    if (entry.runtime_minutes) {
      totalMinutes += entry.runtime_minutes;
    } else if (entry.kind === "tv" || entry.kind === "anime") {
      totalMinutes += 22;
    }
  }

  return {
    yearMonth,
    totalEntries: entries.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    entriesByDate,
  };
}

export type YearMonthSummary = {
  monthIndex: number; // 0-11
  yearMonth: string;
  totalEntries: number;
  totalHours: number;
};

export type YearSummary = {
  year: number;
  totalEntries: number;
  totalHours: number;
  months: YearMonthSummary[];
};

/**
 * Aggregate the user's watch_entries for an entire year, bucketed by month.
 * One query for the whole year; bucketing is done in memory.
 */
export async function getYearSummary(year: number): Promise<YearSummary> {
  const range = yearRange(year);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_entries")
    .select(
      `watched_on,
       media_items!inner ( kind, runtime_minutes )`,
    )
    .gte("watched_on", range.start)
    .lt("watched_on", range.endExclusive);

  if (error) {
    throw new Error(`Error cargando vista anual: ${error.message}`);
  }

  const monthBuckets: Array<{ totalEntries: number; totalMinutes: number }> = Array.from(
    { length: 12 },
    () => ({ totalEntries: 0, totalMinutes: 0 }),
  );
  let totalEntries = 0;
  let totalMinutes = 0;

  for (const row of data ?? []) {
    const month = Number.parseInt(row.watched_on.slice(5, 7), 10) - 1;
    if (month < 0 || month > 11) continue;

    const media = row.media_items as unknown as {
      kind: "movie" | "tv" | "anime";
      runtime_minutes: number | null;
    };
    const minutes =
      media.runtime_minutes ?? (media.kind === "tv" || media.kind === "anime" ? 22 : 0);

    const bucket = monthBuckets[month];
    if (bucket) {
      bucket.totalEntries += 1;
      bucket.totalMinutes += minutes;
    }
    totalEntries += 1;
    totalMinutes += minutes;
  }

  const months: YearMonthSummary[] = monthBuckets.map((bucket, monthIndex) => ({
    monthIndex,
    yearMonth: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    totalEntries: bucket.totalEntries,
    totalHours: Math.round((bucket.totalMinutes / 60) * 10) / 10,
  }));

  return {
    year,
    totalEntries,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    months,
  };
}

export type KindHours = {
  movie: number;
  tv: number;
  anime: number;
};

export type UserOverview = {
  totalEntries: number;
  totalHours: number;
  hoursByKind: KindHours;
};

export type TopRatedItem = {
  id: string;
  title: string;
  poster_url: string | null;
  kind: "movie" | "tv" | "anime";
  year: number | null;
  bestRating: number;
};

/**
 * Aggregate the current user's overall stats: total views, total estimated
 * hours, and hours by media kind. Computes from watch_entries joined with
 * media_items (one DB roundtrip).
 */
export async function getUserOverviewForUser(
  client: StatsClient,
  userId: string,
): Promise<UserOverview> {
  const { data, error } = await client
    .from("watch_entries")
    .select(`watched_on, media_items!inner ( kind, runtime_minutes )`)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Error cargando overview: ${error.message}`);
  }

  const hoursByKind: KindHours = { movie: 0, tv: 0, anime: 0 };
  let totalEntries = 0;
  let totalMinutes = 0;

  for (const row of data ?? []) {
    const media = row.media_items as unknown as {
      kind: "movie" | "tv" | "anime";
      runtime_minutes: number | null;
    };
    const minutes =
      media.runtime_minutes ?? (media.kind === "tv" || media.kind === "anime" ? 22 : 0);
    hoursByKind[media.kind] += minutes;
    totalEntries += 1;
    totalMinutes += minutes;
  }

  return {
    totalEntries,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    hoursByKind: {
      movie: Math.round((hoursByKind.movie / 60) * 10) / 10,
      tv: Math.round((hoursByKind.tv / 60) * 10) / 10,
      anime: Math.round((hoursByKind.anime / 60) * 10) / 10,
    },
  };
}

/** Authed wrapper: overall stats for the current user. */
export async function getUserOverview(): Promise<UserOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getUserOverviewForUser(supabase, user?.id ?? NIL_UUID);
}

// ===========================================================================
// Activity heatmap + viewing streak
// ===========================================================================

export type HeatmapDay = { date: string; count: number };

export type ActivityStats = {
  /** Chronological days covering the grid window, 7 per week starting Sunday. */
  days: HeatmapDay[];
  /** Highest single-day count in the window (for color scaling/labels). */
  maxCount: number;
  /** Days with at least one entry inside the grid window. */
  activeDays: number;
  /** Consecutive days up to today (or yesterday) with an entry. */
  currentStreak: number;
  /** Longest run of consecutive days across the user's whole history. */
  longestStreak: number;
};

const HEATMAP_WEEKS = 53;

/** Today's date (YYYY-MM-DD) in the user's wall-clock zone (Colombia, UTC-5). */
function todayInColombia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/** Shifts a YYYY-MM-DD string by `delta` days using UTC math (DST-safe). */
function shiftDay(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function buildHeatmap(
  counts: Map<string, number>,
  today: string,
): { days: HeatmapDay[]; maxCount: number; activeDays: number } {
  // Anchor the last column to the Saturday of the current week so every column
  // is a full Sun→Sat stripe, then walk back HEATMAP_WEEKS weeks.
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=Sun … 6=Sat
  const end = shiftDay(today, 6 - dow);
  const totalDays = HEATMAP_WEEKS * 7;
  const start = shiftDay(end, -(totalDays - 1));

  const days: HeatmapDay[] = [];
  let maxCount = 0;
  let activeDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const date = shiftDay(start, i);
    const count = counts.get(date) ?? 0;
    if (count > maxCount) maxCount = count;
    if (count > 0) activeDays += 1;
    days.push({ date, count });
  }
  return { days, maxCount, activeDays };
}

function computeStreaks(dates: Set<string>, today: string): { current: number; longest: number } {
  if (dates.size === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (shiftDay(sorted[i - 1] as string, 1) === sorted[i]) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  // The current streak stays "alive" if the user watched today or yesterday.
  let cursor = today;
  if (!dates.has(cursor)) {
    cursor = shiftDay(today, -1);
    if (!dates.has(cursor)) return { current: 0, longest };
  }
  let current = 0;
  while (dates.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { current, longest };
}

/**
 * Computes the GitHub-style activity heatmap (last ~12 months) from the user's
 * watch_entries, and the "usage" streak from the union of days they logged a
 * view OR opened the app (user_activity). Heatmap stays view-based (it shows
 * what was watched); the streak counts showing up.
 */
export async function getActivityStatsForUser(
  client: StatsClient,
  userId: string,
): Promise<ActivityStats> {
  const [entriesRes, visitsRes] = await Promise.all([
    client.from("watch_entries").select("watched_on").eq("user_id", userId),
    client.from("user_activity").select("active_on").eq("user_id", userId),
  ]);
  if (entriesRes.error) {
    throw new Error(`Error cargando actividad: ${entriesRes.error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of entriesRes.data ?? []) {
    counts.set(row.watched_on, (counts.get(row.watched_on) ?? 0) + 1);
  }

  const today = todayInColombia();
  const grid = buildHeatmap(counts, today);

  // Streak = days watched ∪ days the app was opened.
  const streakDates = new Set<string>(counts.keys());
  for (const row of visitsRes.data ?? []) streakDates.add(row.active_on);
  const { current, longest } = computeStreaks(streakDates, today);

  return {
    days: grid.days,
    maxCount: grid.maxCount,
    activeDays: grid.activeDays,
    currentStreak: current,
    longestStreak: longest,
  };
}

/** Authed wrapper: activity heatmap + streaks for the current user. */
export async function getActivityStats(): Promise<ActivityStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getActivityStatsForUser(supabase, user?.id ?? NIL_UUID);
}

// ===========================================================================
// Top genres + decade distribution (across watched titles)
// ===========================================================================

export type GenreCount = { name: string; count: number };
export type DecadeCount = { decade: number; count: number };
export type LibraryBreakdown = { topGenres: GenreCount[]; decades: DecadeCount[] };

/**
 * Aggregates the user's *watched* titles (media_items with at least one
 * watch_entry) into top genres and a release-decade distribution. Genres are
 * localized via the shared genre map; unknown values are skipped/fall back.
 */
export async function getLibraryBreakdownForUser(
  client: StatsClient,
  userId: string,
  locale: "es" | "en",
  genresLimit = 8,
): Promise<LibraryBreakdown> {
  const { data, error } = await client
    .from("media_items")
    .select("genres, year, watch_entries!inner ( id )")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Error cargando desglose: ${error.message}`);
  }

  const genreCounts = new Map<string, number>();
  const decadeCounts = new Map<number, number>();

  for (const row of data ?? []) {
    const genres = Array.isArray(row.genres) ? (row.genres as Array<string | number>) : [];
    // Dedupe per title so a title counts once toward each of its genres.
    const seen = new Set<string>();
    for (const raw of genres) {
      const label = genreLabel(raw, locale);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
    }
    if (typeof row.year === "number" && row.year > 1900) {
      const decade = Math.floor(row.year / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
    }
  }

  const topGenres = [...genreCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, genresLimit);
  const decades = [...decadeCounts.entries()]
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade);

  return { topGenres, decades };
}

/** Authed wrapper: genre + decade breakdown for the current user. */
export async function getLibraryBreakdown(
  locale: "es" | "en",
  genresLimit = 8,
): Promise<LibraryBreakdown> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getLibraryBreakdownForUser(supabase, user?.id ?? NIL_UUID, locale, genresLimit);
}

/**
 * Returns the user's top-N media_items by their best watch_entry rating.
 * Items without any rating are excluded.
 */
export async function getTopRatedMediaForUser(
  client: StatsClient,
  userId: string,
  limit = 5,
): Promise<TopRatedItem[]> {
  const { data, error } = await client
    .from("watch_entries")
    .select(`rating, media_items!inner ( id, title, poster_url, kind, year )`)
    .eq("user_id", userId)
    .not("rating", "is", null);

  if (error) {
    throw new Error(`Error cargando top rated: ${error.message}`);
  }

  const byMediaId = new Map<string, TopRatedItem>();
  for (const row of data ?? []) {
    if (row.rating === null) continue;
    const media = row.media_items as unknown as {
      id: string;
      title: string;
      poster_url: string | null;
      kind: "movie" | "tv" | "anime";
      year: number | null;
    };
    const existing = byMediaId.get(media.id);
    if (!existing || row.rating > existing.bestRating) {
      byMediaId.set(media.id, {
        id: media.id,
        title: media.title,
        poster_url: media.poster_url,
        kind: media.kind,
        year: media.year,
        bestRating: row.rating,
      });
    }
  }

  return [...byMediaId.values()].sort((a, b) => b.bestRating - a.bestRating).slice(0, limit);
}

/** Authed wrapper: top-rated titles for the current user. */
export async function getTopRatedMedia(limit = 5): Promise<TopRatedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getTopRatedMediaForUser(supabase, user?.id ?? NIL_UUID, limit);
}

/**
 * Returns the user's top-N media_items watched in a given year, ranked by
 * best rating from watch_entries inside that year.
 */
export async function getTopOfYear(year: number, limit = 5): Promise<TopRatedItem[]> {
  const range = yearRange(year);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_entries")
    .select(`rating, media_items!inner ( id, title, poster_url, kind, year )`)
    .gte("watched_on", range.start)
    .lt("watched_on", range.endExclusive)
    .not("rating", "is", null);

  if (error) {
    throw new Error(`Error cargando top del año: ${error.message}`);
  }

  const byMediaId = new Map<string, TopRatedItem>();
  for (const row of data ?? []) {
    if (row.rating === null) continue;
    const media = row.media_items as unknown as {
      id: string;
      title: string;
      poster_url: string | null;
      kind: "movie" | "tv" | "anime";
      year: number | null;
    };
    const existing = byMediaId.get(media.id);
    if (!existing || row.rating > existing.bestRating) {
      byMediaId.set(media.id, {
        id: media.id,
        title: media.title,
        poster_url: media.poster_url,
        kind: media.kind,
        year: media.year,
        bestRating: row.rating,
      });
    }
  }

  return [...byMediaId.values()].sort((a, b) => b.bestRating - a.bestRating).slice(0, limit);
}
