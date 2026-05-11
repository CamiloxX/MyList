import type { Database } from "@/types/database";

export type MediaStatus = Database["public"]["Enums"]["media_status"];
export type MediaKind = Database["public"]["Enums"]["media_kind"];

export const STATUS_OPTIONS: ReadonlyArray<{ value: MediaStatus; label: string }> = [
  { value: "watching", label: "Viendo" },
  { value: "watched", label: "Vista" },
  { value: "pending", label: "Pendiente" },
  { value: "dropped", label: "Abandonada" },
];

export const KIND_OPTIONS: ReadonlyArray<{ value: MediaKind; label: string }> = [
  { value: "movie", label: "Película" },
  { value: "tv", label: "Serie" },
  { value: "anime", label: "Anime" },
];

export const STATUS_LABEL: Record<MediaStatus, string> = {
  watching: "Viendo",
  watched: "Vista",
  pending: "Pendiente",
  dropped: "Abandonada",
};

export const KIND_LABEL: Record<MediaKind, string> = {
  movie: "Película",
  tv: "Serie",
  anime: "Anime",
};
