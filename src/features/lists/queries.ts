import "server-only";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  posterUrls: string[];
  itemCount: number;
};

/** All of the current user's lists, with title count + a few posters preview. */
export async function getUserLists(): Promise<ListSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, description, cover_url, list_items(position, media_items(poster_url))")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Error cargando listas: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const items =
      (row.list_items as unknown as Array<{
        position: number;
        media_items: { poster_url: string | null } | null;
      }>) ?? [];
    const posterUrls = [...items]
      .sort((a, b) => a.position - b.position)
      .map((it) => it.media_items?.poster_url)
      .filter((p): p is string => Boolean(p))
      .slice(0, 4);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      coverUrl: row.cover_url,
      posterUrls,
      itemCount: items.length,
    };
  });
}

export type ListItemMedia = {
  id: string;
  title: string;
  poster_url: string | null;
  kind: "movie" | "tv" | "anime";
  year: number | null;
};

export type ListVisibility = "private" | "unlisted" | "public";

export type ListWithItems = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  visibility: ListVisibility;
  items: ListItemMedia[];
};

/** A single list plus its titles (ordered), or null if it isn't the user's. */
export async function getListWithItems(listId: string): Promise<ListWithItems | null> {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("lists")
    .select("id, name, description, cover_url, visibility")
    .eq("id", listId)
    .maybeSingle();
  if (!list) return null;

  const { data: rows } = await supabase
    .from("list_items")
    .select("position, media_items!inner ( id, title, poster_url, kind, year )")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  const items: ListItemMedia[] = (rows ?? []).map((r) => r.media_items as unknown as ListItemMedia);
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    coverUrl: list.cover_url,
    visibility: list.visibility as ListVisibility,
    items,
  };
}

export type PublicList = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  posterUrls: string[];
  itemCount: number;
  author: { name: string | null; avatarUrl: string | null };
};

/**
 * Every list marked `public`, for the "Discover" feed. Uses the service-role
 * client to read across users (owner-only RLS would hide them), but only ever
 * exposes public lists and display-only author fields. Most recent first.
 */
export async function getPublicLists(): Promise<PublicList[]> {
  const admin = createServiceRoleClient();
  const { data: lists } = await admin
    .from("lists")
    .select("id, name, description, cover_url, user_id, list_items(position, media_items(poster_url))")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (!lists || lists.length === 0) return [];

  // lists.user_id and profiles.id both reference auth.users — no direct FK for a
  // PostgREST embed, so resolve the authors in a second query.
  const userIds = [...new Set(lists.map((l) => l.user_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);
  const authorById = new Map(
    (profiles ?? []).map((p) => [p.id, { name: p.display_name, avatarUrl: p.avatar_url }]),
  );

  return lists.map((row) => {
    const items =
      (row.list_items as unknown as Array<{
        position: number;
        media_items: { poster_url: string | null } | null;
      }>) ?? [];
    const posterUrls = [...items]
      .sort((a, b) => a.position - b.position)
      .map((it) => it.media_items?.poster_url)
      .filter((p): p is string => Boolean(p))
      .slice(0, 4);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      coverUrl: row.cover_url,
      posterUrls,
      itemCount: items.length,
      author: authorById.get(row.user_id as string) ?? { name: null, avatarUrl: null },
    };
  });
}

export type SharedList = {
  name: string;
  description: string | null;
  coverUrl: string | null;
  items: ListItemMedia[];
};

/**
 * Public read of a shared list, by anyone with the link. Uses the service-role
 * client to bypass owner-only RLS, but ONLY returns the list when it's been
 * shared (visibility != 'private') and exposes just display fields — never the
 * owner or private data. Returns null for private/unknown lists.
 */
export async function getSharedList(listId: string): Promise<SharedList | null> {
  const admin = createServiceRoleClient();
  const { data: list } = await admin
    .from("lists")
    .select("name, description, cover_url, visibility")
    .eq("id", listId)
    .maybeSingle();
  if (!list || list.visibility === "private") return null;

  const { data: rows } = await admin
    .from("list_items")
    .select("position, media_items ( id, title, poster_url, kind, year )")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  const items: ListItemMedia[] = (rows ?? []).map((r) => r.media_items as unknown as ListItemMedia);
  return { name: list.name, description: list.description, coverUrl: list.cover_url, items };
}

export type ListMembership = { id: string; name: string; contains: boolean };

/** Every list the user has, flagged with whether it contains the given title. */
export async function getListsForItem(mediaItemId: string): Promise<ListMembership[]> {
  const supabase = await createClient();
  const [listsRes, membersRes] = await Promise.all([
    supabase.from("lists").select("id, name").order("created_at", { ascending: true }),
    supabase.from("list_items").select("list_id").eq("media_item_id", mediaItemId),
  ]);
  const inSet = new Set((membersRes.data ?? []).map((m) => m.list_id));
  return (listsRes.data ?? []).map((l) => ({ id: l.id, name: l.name, contains: inSet.has(l.id) }));
}
