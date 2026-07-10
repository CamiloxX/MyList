import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MediaSource = Database["public"]["Enums"]["media_source"];
type MediaKind = Database["public"]["Enums"]["media_kind"];

export type LibraryItemKey = string;

export function libraryItemKey(args: {
  source: MediaSource;
  sourceId: string;
  kind: MediaKind;
}): LibraryItemKey {
  return `${args.source}:${args.kind}:${args.sourceId}`;
}

/**
 * Returns the set of (source:kind:sourceId) keys already present in the current
 * user's library. Search and Discover use this to mark cards as "already added"
 * so the user can't accidentally re-add a title. Returns an empty set if the
 * user is signed out or the query fails — both cases degrade to the previous
 * "show Add button" behavior.
 */
export async function getLibraryItemKeys(): Promise<Set<LibraryItemKey>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("media_items")
    .select("source, source_id, kind")
    .eq("user_id", user.id);

  if (error || !data) return new Set();
  return new Set(
    data.map((row) =>
      libraryItemKey({ source: row.source, sourceId: row.source_id, kind: row.kind }),
    ),
  );
}
