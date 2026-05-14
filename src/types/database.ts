// Hand-written from supabase/migrations/001_initial_schema.sql
//
// To regenerate from the live schema once SUPABASE_ACCESS_TOKEN is available:
//
//   pnpm dlx supabase gen types typescript --project-id kefozbpfdbcdtsykbhws --schema public > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_items: {
        Row: {
          id: string;
          user_id: string;
          source: Database["public"]["Enums"]["media_source"];
          source_id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          title: string;
          original_title: string | null;
          poster_url: string | null;
          year: number | null;
          runtime_minutes: number | null;
          episode_count: number | null;
          genres: Json;
          raw_metadata: Json | null;
          status: Database["public"]["Enums"]["media_status"];
          visibility: Database["public"]["Enums"]["visibility_level"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: Database["public"]["Enums"]["media_source"];
          source_id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          title: string;
          original_title?: string | null;
          poster_url?: string | null;
          year?: number | null;
          runtime_minutes?: number | null;
          episode_count?: number | null;
          genres?: Json;
          raw_metadata?: Json | null;
          status?: Database["public"]["Enums"]["media_status"];
          visibility?: Database["public"]["Enums"]["visibility_level"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: Database["public"]["Enums"]["media_source"];
          source_id?: string;
          kind?: Database["public"]["Enums"]["media_kind"];
          title?: string;
          original_title?: string | null;
          poster_url?: string | null;
          year?: number | null;
          runtime_minutes?: number | null;
          episode_count?: number | null;
          genres?: Json;
          raw_metadata?: Json | null;
          status?: Database["public"]["Enums"]["media_status"];
          visibility?: Database["public"]["Enums"]["visibility_level"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watch_entries: {
        Row: {
          id: string;
          user_id: string;
          media_item_id: string;
          watched_on: string;
          rating: number | null;
          notes: string | null;
          platform: string | null;
          season_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_item_id: string;
          watched_on: string;
          rating?: number | null;
          notes?: string | null;
          platform?: string | null;
          season_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_item_id?: string;
          watched_on?: string;
          rating?: number | null;
          notes?: string | null;
          platform?: string | null;
          season_number?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "watch_entries_media_item_id_fkey";
            columns: ["media_item_id"];
            isOneToOne: false;
            referencedRelation: "media_items";
            referencedColumns: ["id"];
          },
        ];
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          visibility: Database["public"]["Enums"]["visibility_level"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          visibility?: Database["public"]["Enums"]["visibility_level"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          visibility?: Database["public"]["Enums"]["visibility_level"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      list_items: {
        Row: {
          list_id: string;
          media_item_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          list_id: string;
          media_item_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          list_id?: string;
          media_item_id?: string;
          position?: number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_items_media_item_id_fkey";
            columns: ["media_item_id"];
            isOneToOne: false;
            referencedRelation: "media_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
      forum_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      forum_threads: {
        Row: {
          id: string;
          category_id: string;
          user_id: string;
          title: string;
          pinned: boolean;
          locked: boolean;
          reply_count: number;
          last_post_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          user_id: string;
          title: string;
          pinned?: boolean;
          locked?: boolean;
          reply_count?: number;
          last_post_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          user_id?: string;
          title?: string;
          pinned?: boolean;
          locked?: boolean;
          reply_count?: number;
          last_post_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_posts: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string | null;
          body_md: string;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id?: string | null;
          body_md: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string | null;
          body_md?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "forum_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_reactions: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      title_comments: {
        Row: {
          id: string;
          user_id: string | null;
          source: Database["public"]["Enums"]["media_source"];
          source_id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          body_md: string;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          source: Database["public"]["Enums"]["media_source"];
          source_id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          body_md: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          source?: Database["public"]["Enums"]["media_source"];
          source_id?: string;
          kind?: Database["public"]["Enums"]["media_kind"];
          body_md?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_new_user: { Args: Record<string, never>; Returns: unknown };
      set_updated_at: { Args: Record<string, never>; Returns: unknown };
      is_admin: { Args: { uid: string }; Returns: boolean };
      bump_thread_on_post: { Args: Record<string, never>; Returns: unknown };
    };
    Enums: {
      media_kind: "movie" | "tv" | "anime";
      media_source: "tmdb" | "anilist";
      media_status: "watching" | "watched" | "pending" | "dropped";
      visibility_level: "private" | "unlisted" | "public";
    };
    CompositeTypes: Record<string, never>;
  };
};
