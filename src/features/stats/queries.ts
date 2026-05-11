import "server-only";

import { yearMonthRange, yearRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

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
export async function getUserOverview(): Promise<UserOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_entries")
    .select(`watched_on, media_items!inner ( kind, runtime_minutes )`);

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

/**
 * Returns the user's top-N media_items by their best watch_entry rating.
 * Items without any rating are excluded.
 */
export async function getTopRatedMedia(limit = 5): Promise<TopRatedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_entries")
    .select(`rating, media_items!inner ( id, title, poster_url, kind, year )`)
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
