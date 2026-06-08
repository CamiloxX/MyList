// Hand-written from supabase/migrations/001_initial_schema.sql
//
// To regenerate from the live schema once SUPABASE_ACCESS_TOKEN is available:
//
//   pnpm dlx supabase gen types typescript --project-id kefozbpfdbcdtsykbhws --schema public > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string;
          user_id: string | null;
          body: string;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          body: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          body?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_restrictions: {
        Row: {
          user_id: string;
          type: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          user_id: string;
          type: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          user_id?: string;
          type?: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      user_activity: {
        Row: {
          user_id: string;
          active_on: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          active_on: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          active_on?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          display_name_updated_at: string | null;
          avatar_url: string | null;
          locale: string;
          is_admin: boolean;
          featured_badge_ids: string[];
          username: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          display_name_updated_at?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_admin?: boolean;
          featured_badge_ids?: string[];
          username?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          display_name_updated_at?: string | null;
          avatar_url?: string | null;
          locale?: string;
          is_admin?: boolean;
          featured_badge_ids?: string[];
          username?: string | null;
          is_public?: boolean;
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
          episodes_watched: number;
          genres: Json;
          raw_metadata: Json | null;
          status: Database["public"]["Enums"]["media_status"];
          notify_episodes: boolean;
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
          episodes_watched?: number;
          genres?: Json;
          raw_metadata?: Json | null;
          status?: Database["public"]["Enums"]["media_status"];
          notify_episodes?: boolean;
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
          episodes_watched?: number;
          genres?: Json;
          raw_metadata?: Json | null;
          status?: Database["public"]["Enums"]["media_status"];
          notify_episodes?: boolean;
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
          cover_url: string | null;
          visibility: Database["public"]["Enums"]["visibility_level"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_url?: string | null;
          visibility?: Database["public"]["Enums"]["visibility_level"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_url?: string | null;
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
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          i18n_key: string | null;
          icon_key: string | null;
          icon_url: string | null;
          tier: string;
          criterion: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          i18n_key?: string | null;
          icon_key?: string | null;
          icon_url?: string | null;
          tier?: string;
          criterion?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          i18n_key?: string | null;
          icon_key?: string | null;
          icon_url?: string | null;
          tier?: string;
          criterion?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scheduled_notifications: {
        Row: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          target_user_id: string | null;
          scheduled_for: string;
          sent_at: string | null;
          result: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          url?: string | null;
          target_user_id?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          result?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          url?: string | null;
          target_user_id?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          result?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
      is_chat_restricted: { Args: { uid: string }; Returns: boolean };
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
