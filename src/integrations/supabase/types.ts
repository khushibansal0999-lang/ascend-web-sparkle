export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      habit: {
        Row: {
          class_name: string
          created_at: string
          difficulty_rank: Database["public"]["Enums"]["rank_code"]
          id: string
          is_archived: boolean
          name: string
          stat_id: string
          stat_value_per_check_in: number
          user_id: string
          xp_per_check_in: number
        }
        Insert: {
          class_name: string
          created_at?: string
          difficulty_rank?: Database["public"]["Enums"]["rank_code"]
          id?: string
          is_archived?: boolean
          name: string
          stat_id: string
          stat_value_per_check_in?: number
          user_id: string
          xp_per_check_in?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          difficulty_rank?: Database["public"]["Enums"]["rank_code"]
          id?: string
          is_archived?: boolean
          name?: string
          stat_id?: string
          stat_value_per_check_in?: number
          user_id?: string
          xp_per_check_in?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stat_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_check_in: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          stat_id: string
          stat_value: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          created_at?: string
          date: string
          habit_id: string
          id?: string
          stat_id: string
          stat_value: number
          user_id: string
          xp_awarded: number
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          stat_id?: string
          stat_value?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_check_in_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_check_in_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stat_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      level_event: {
        Row: {
          id: string
          new_level: number
          new_rank: Database["public"]["Enums"]["rank_code"] | null
          new_stat_value: number | null
          occurred_at: string
          prev_level: number
          prev_rank: Database["public"]["Enums"]["rank_code"] | null
          prev_stat_value: number | null
          shared_at: string | null
          stat_id: string | null
          title_unlocked_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          new_level: number
          new_rank?: Database["public"]["Enums"]["rank_code"] | null
          new_stat_value?: number | null
          occurred_at?: string
          prev_level: number
          prev_rank?: Database["public"]["Enums"]["rank_code"] | null
          prev_stat_value?: number | null
          shared_at?: string | null
          stat_id?: string | null
          title_unlocked_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          new_level?: number
          new_rank?: Database["public"]["Enums"]["rank_code"] | null
          new_stat_value?: number | null
          occurred_at?: string
          prev_level?: number
          prev_rank?: Database["public"]["Enums"]["rank_code"] | null
          prev_stat_value?: number | null
          shared_at?: string | null
          stat_id?: string | null
          title_unlocked_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_event_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stat_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_event_title_unlocked_id_fkey"
            columns: ["title_unlocked_id"]
            isOneToOne: false
            referencedRelation: "title_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          epithet: string | null
          hunter_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          epithet?: string | null
          hunter_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          epithet?: string | null
          hunter_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quest: {
        Row: {
          boss_name: string | null
          completed_at: string | null
          created_at: string
          end_date: string
          id: string
          linked_habit_id: string | null
          scope: Database["public"]["Enums"]["quest_scope"]
          source: Database["public"]["Enums"]["quest_source"]
          source_template_id: string | null
          start_date: string
          stat_id: string | null
          stat_value: number | null
          target_count: number
          title: string
          title_reward_id: string | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          boss_name?: string | null
          completed_at?: string | null
          created_at?: string
          end_date: string
          id?: string
          linked_habit_id?: string | null
          scope: Database["public"]["Enums"]["quest_scope"]
          source: Database["public"]["Enums"]["quest_source"]
          source_template_id?: string | null
          start_date: string
          stat_id?: string | null
          stat_value?: number | null
          target_count?: number
          title: string
          title_reward_id?: string | null
          user_id: string
          xp_reward: number
        }
        Update: {
          boss_name?: string | null
          completed_at?: string | null
          created_at?: string
          end_date?: string
          id?: string
          linked_habit_id?: string | null
          scope?: Database["public"]["Enums"]["quest_scope"]
          source?: Database["public"]["Enums"]["quest_source"]
          source_template_id?: string | null
          start_date?: string
          stat_id?: string | null
          stat_value?: number | null
          target_count?: number
          title?: string
          title_reward_id?: string | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_linked_habit_id_fkey"
            columns: ["linked_habit_id"]
            isOneToOne: false
            referencedRelation: "habit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "system_quest_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stat_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_title_reward_id_fkey"
            columns: ["title_reward_id"]
            isOneToOne: false
            referencedRelation: "title_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_definition: {
        Row: {
          code: Database["public"]["Enums"]["rank_code"]
          id: string
          min_level: number
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["rank_code"]
          id?: string
          min_level: number
          sort_order: number
        }
        Update: {
          code?: Database["public"]["Enums"]["rank_code"]
          id?: string
          min_level?: number
          sort_order?: number
        }
        Relationships: []
      }
      stat_definition: {
        Row: {
          code: Database["public"]["Enums"]["stat_code"]
          display_name: string
          icon: string
          id: string
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["stat_code"]
          display_name: string
          icon: string
          id?: string
          sort_order: number
        }
        Update: {
          code?: Database["public"]["Enums"]["stat_code"]
          display_name?: string
          icon?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      system_quest_template: {
        Row: {
          id: string
          recurrence: string
          stat_id: string | null
          stat_value: number | null
          title: string
          xp_reward: number
        }
        Insert: {
          id?: string
          recurrence?: string
          stat_id?: string | null
          stat_value?: number | null
          title: string
          xp_reward: number
        }
        Update: {
          id?: string
          recurrence?: string
          stat_id?: string | null
          stat_value?: number | null
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_quest_template_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stat_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      title_definition: {
        Row: {
          id: string
          name: string
          unlock_condition: string
        }
        Insert: {
          id?: string
          name: string
          unlock_condition: string
        }
        Update: {
          id?: string
          name?: string
          unlock_condition?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      quest_scope: "daily" | "weekly" | "monthly"
      quest_source: "system" | "custom"
      rank_code: "e" | "d" | "c" | "b" | "a" | "s"
      stat_code: "str" | "vit" | "int" | "disc" | "will"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      quest_scope: ["daily", "weekly", "monthly"],
      quest_source: ["system", "custom"],
      rank_code: ["e", "d", "c", "b", "a", "s"],
      stat_code: ["str", "vit", "int", "disc", "will"],
    },
  },
} as const
