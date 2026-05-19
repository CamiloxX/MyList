import "server-only";

export type ExportFormat = "json" | "csv" | "txt";

export type ExportMediaItem = {
  id: string;
  source: "tmdb" | "anilist";
  source_id: string;
  kind: "movie" | "tv" | "anime";
  title: string;
  original_title: string | null;
  year: number | null;
  runtime_minutes: number | null;
  episode_count: number | null;
  poster_url: string | null;
  status: "watching" | "watched" | "pending" | "dropped";
  genres: unknown;
  created_at: string;
  updated_at: string;
};

export type ExportWatchEntry = {
  id: string;
  media_item_id: string;
  watched_on: string;
  rating: number | null;
  platform: string | null;
  season_number: number | null;
  notes: string | null;
  created_at: string;
};

export type ExportPayload = {
  exported_at: string;
  user_email: string | null;
  items_count: number;
  entries_count: number;
  items: ExportMediaItem[];
  entries: ExportWatchEntry[];
};

const KIND_LABEL: Record<ExportMediaItem["kind"], { es: string; en: string }> = {
  movie: { es: "Película", en: "Movie" },
  tv: { es: "Serie", en: "TV" },
  anime: { es: "Anime", en: "Anime" },
};

const STATUS_LABEL: Record<ExportMediaItem["status"], { es: string; en: string }> = {
  watching: { es: "Viendo", en: "Watching" },
  watched: { es: "Vista", en: "Watched" },
  pending: { es: "Pendiente", en: "Pending" },
  dropped: { es: "Abandonada", en: "Dropped" },
};

export function toJson(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * CSV layout: one row per watch_entry, with item columns repeated. Items with
 * no entries (pending / dropped) emit a single row with empty entry columns so
 * the user keeps the full inventory in the spreadsheet. UTF-8 BOM is prefixed
 * so Excel opens accented titles correctly.
 */
export function toCsv(payload: ExportPayload): string {
  const entriesByItem = new Map<string, ExportWatchEntry[]>();
  for (const e of payload.entries) {
    const list = entriesByItem.get(e.media_item_id) ?? [];
    list.push(e);
    entriesByItem.set(e.media_item_id, list);
  }

  const header = [
    "kind",
    "title",
    "original_title",
    "year",
    "status",
    "source",
    "source_id",
    "watched_on",
    "rating",
    "platform",
    "season_number",
    "notes",
    "added_at",
  ];
  const rows: string[] = [header.join(",")];

  for (const item of payload.items) {
    const itemEntries = entriesByItem.get(item.id);
    if (!itemEntries || itemEntries.length === 0) {
      rows.push(
        [
          item.kind,
          item.title,
          item.original_title,
          item.year,
          item.status,
          item.source,
          item.source_id,
          "",
          "",
          "",
          "",
          "",
          item.created_at,
        ]
          .map(csvEscape)
          .join(","),
      );
      continue;
    }
    for (const entry of itemEntries) {
      rows.push(
        [
          item.kind,
          item.title,
          item.original_title,
          item.year,
          item.status,
          item.source,
          item.source_id,
          entry.watched_on,
          entry.rating,
          entry.platform,
          entry.season_number,
          entry.notes,
          item.created_at,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }

  return `﻿${rows.join("\r\n")}\r\n`;
}

/**
 * TXT layout: human-readable inventory grouped by kind, then status. Each
 * media item shows title (year), status, and an indented list of watch dates
 * with rating/platform. Designed to be skimmable when opened in Notepad.
 */
export function toTxt(payload: ExportPayload, locale: "es" | "en"): string {
  const isEs = locale === "es";
  const entriesByItem = new Map<string, ExportWatchEntry[]>();
  for (const e of payload.entries) {
    const list = entriesByItem.get(e.media_item_id) ?? [];
    list.push(e);
    entriesByItem.set(e.media_item_id, list);
  }
  for (const list of entriesByItem.values()) {
    list.sort((a, b) => a.watched_on.localeCompare(b.watched_on));
  }

  const lines: string[] = [];
  lines.push("MyList — Export");
  lines.push("================");
  lines.push(isEs ? `Exportado: ${payload.exported_at}` : `Exported: ${payload.exported_at}`);
  if (payload.user_email) lines.push(isEs ? `Usuario: ${payload.user_email}` : `User: ${payload.user_email}`);
  lines.push(
    isEs
      ? `Total: ${payload.items_count} títulos · ${payload.entries_count} visualizaciones`
      : `Total: ${payload.items_count} titles · ${payload.entries_count} viewings`,
  );
  lines.push("");

  const kinds: ExportMediaItem["kind"][] = ["movie", "tv", "anime"];
  for (const kind of kinds) {
    const kindItems = payload.items.filter((i) => i.kind === kind);
    if (kindItems.length === 0) continue;

    lines.push(`## ${isEs ? KIND_LABEL[kind].es : KIND_LABEL[kind].en} (${kindItems.length})`);
    lines.push("-".repeat(40));

    const statuses: ExportMediaItem["status"][] = ["watched", "watching", "pending", "dropped"];
    for (const status of statuses) {
      const group = kindItems
        .filter((i) => i.status === status)
        .sort((a, b) => a.title.localeCompare(b.title));
      if (group.length === 0) continue;

      lines.push("");
      lines.push(`[${isEs ? STATUS_LABEL[status].es : STATUS_LABEL[status].en}]`);
      for (const item of group) {
        const year = item.year ? ` (${item.year})` : "";
        lines.push(`  • ${item.title}${year}`);
        const itemEntries = entriesByItem.get(item.id) ?? [];
        for (const entry of itemEntries) {
          const parts: string[] = [entry.watched_on];
          if (entry.season_number !== null) {
            parts.push(isEs ? `T${entry.season_number}` : `S${entry.season_number}`);
          }
          if (entry.rating !== null) parts.push(`★ ${entry.rating}/10`);
          if (entry.platform) parts.push(entry.platform);
          lines.push(`      - ${parts.join(" · ")}`);
          if (entry.notes) lines.push(`        " ${entry.notes.replace(/\n/g, " ")}"`);
        }
      }
    }
    lines.push("");
  }

  return lines.join("\r\n");
}

export function exportContent(
  payload: ExportPayload,
  format: ExportFormat,
  locale: "es" | "en",
): { content: string; mimeType: string; extension: string } {
  switch (format) {
    case "json":
      return { content: toJson(payload), mimeType: "application/json", extension: "json" };
    case "csv":
      return { content: toCsv(payload), mimeType: "text/csv;charset=utf-8", extension: "csv" };
    case "txt":
      return { content: toTxt(payload, locale), mimeType: "text/plain;charset=utf-8", extension: "txt" };
  }
}
