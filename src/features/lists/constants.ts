// Shared list enums + their derived types. These live OUTSIDE actions.ts on
// purpose: a "use server" file may only export async functions, so exporting
// these runtime constants from there crashes the whole server-actions module
// (Next.js: "A 'use server' file can only export async functions, found object").

export const LIST_SORT_CRITERIA = ["title", "year_desc", "year_asc", "kind"] as const;
export type ListSortCriterion = (typeof LIST_SORT_CRITERIA)[number];

export const LIST_VISIBILITY = ["private", "unlisted", "public"] as const;
export type ListVisibility = (typeof LIST_VISIBILITY)[number];
