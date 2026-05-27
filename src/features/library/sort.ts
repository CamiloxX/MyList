export const LIBRARY_SORT_OPTIONS = [
  "recent",
  "title-asc",
  "title-desc",
  "year-desc",
  "year-asc",
] as const;

export type LibrarySort = (typeof LIBRARY_SORT_OPTIONS)[number];

export const DEFAULT_LIBRARY_SORT: LibrarySort = "recent";

export function parseLibrarySort(value: string | undefined | null): LibrarySort {
  if (!value) return DEFAULT_LIBRARY_SORT;
  return (LIBRARY_SORT_OPTIONS as ReadonlyArray<string>).includes(value)
    ? (value as LibrarySort)
    : DEFAULT_LIBRARY_SORT;
}
