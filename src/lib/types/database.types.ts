/**
 * Generated from the live Supabase project with:
 *   supabase gen types typescript --linked > src/lib/types/database.types.ts
 * Do not hand-edit the Database type below — re-run the command above after
 * any schema change. The ObjectivePeriod alias at the bottom is hand-added
 * for convenience and is safe to keep across regenerations.
 */

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
      affirmations: {
        Row: {
          created_at: string
          for_date: string
          id: string
          position: number
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          for_date: string
          id?: string
          position: number
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          for_date?: string
          id?: string
          position?: number
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_actions: {
        Row: {
          created_at: string
          done_at: string | null
          due_date: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          due_date?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          due_date?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_board_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dream_board_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "dream_board_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dream_board_items: {
        Row: {
          content: string
          created_at: string
          id: string
          image_path: string | null
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_path?: string | null
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_path?: string | null
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dreams: {
        Row: {
          created_at: string
          description: string
          id: string
          realized_at: string | null
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          realized_at?: string | null
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          realized_at?: string | null
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_reserve: {
        Row: {
          balance_cents: number
          target_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          target_months?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          target_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          access: string
          created_at: string
          id: string
          kind: string
          position: number
          published: boolean
          slug: string
          summary: Json
          title: Json
          updated_at: string
        }
        Insert: {
          access?: string
          created_at?: string
          id?: string
          kind: string
          position?: number
          published?: boolean
          slug: string
          summary?: Json
          title: Json
          updated_at?: string
        }
        Update: {
          access?: string
          created_at?: string
          id?: string
          kind?: string
          position?: number
          published?: boolean
          slug?: string
          summary?: Json
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      program_lessons: {
        Row: {
          body: Json
          created_at: string
          duration_minutes: number | null
          id: string
          media_url: string | null
          position: number
          program_id: string
          steps: Json
          title: Json
        }
        Insert: {
          body?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          media_url?: string | null
          position?: number
          program_id: string
          steps?: Json
          title: Json
        }
        Update: {
          body?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          media_url?: string | null
          position?: number
          program_id?: string
          steps?: Json
          title?: Json
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          program_id: string
          project_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          program_id: string
          project_id?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          program_id?: string
          project_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          done_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          done_at?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          done_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      spirit_settings: {
        Row: {
          practice_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          practice_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          practice_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spirit_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          kind: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          kind: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_items: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          kind: string
          name: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_debts: {
        Row: {
          balance_cents: number
          created_at: string
          currency: string
          id: string
          monthly_payment_cents: number
          monthly_rate_pct: number
          name: string
          user_id: string
        }
        Insert: {
          balance_cents: number
          created_at?: string
          currency?: string
          id?: string
          monthly_payment_cents?: number
          monthly_rate_pct?: number
          name: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          monthly_payment_cents?: number
          monthly_rate_pct?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_goals: {
        Row: {
          created_at: string
          currency: string
          dream_id: string | null
          id: string
          name: string
          saved_cents: number
          target_cents: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          dream_id?: string | null
          id?: string
          name: string
          saved_cents?: number
          target_cents: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          dream_id?: string | null
          id?: string
          name?: string
          saved_cents?: number
          target_cents?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          currency: string
          description: string
          id: string
          kind: string
          occurred_on: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          kind: string
          occurred_on: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          kind?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          currency: string
          fetched_at: string
          per_usd: number
        }
        Insert: {
          currency: string
          fetched_at?: string
          per_usd: number
        }
        Update: {
          currency?: string
          fetched_at?: string
          per_usd?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: number
          props: Json
          user_hash: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: number
          props?: Json
          user_hash: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: number
          props?: Json
          user_hash?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      objectives: {
        Row: {
          declaration: string
          id: string
          period: Database["public"]["Enums"]["objective_period"]
          updated_at: string
          user_id: string
        }
        Insert: {
          declaration?: string
          id?: string
          period: Database["public"]["Enums"]["objective_period"]
          updated_at?: string
          user_id: string
        }
        Update: {
          declaration?: string
          id?: string
          period?: Database["public"]["Enums"]["objective_period"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          analytics_opt_in: boolean
          created_at: string
          display_name: string | null
          id: string
          preferred_currency: string
          preferred_language: string
          timezone: string
          updated_at: string
        }
        Insert: {
          analytics_opt_in?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          preferred_currency?: string
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          analytics_opt_in?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_currency?: string
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_steps: {
        Row: {
          created_at: string
          done_at: string | null
          id: string
          position: number
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          dream_id: string | null
          id: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string
          dream_id?: string | null
          id?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          dream_id?: string | null
          id?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsules: {
        Row: {
          claimed_at: string | null
          created_at: string
          deliver_on: string
          delivered_at: string | null
          delivery_attempts: number
          delivery_error: string | null
          id: string
          message: string
          retention_tier: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          deliver_on: string
          delivered_at?: string | null
          delivery_attempts?: number
          delivery_error?: string | null
          id?: string
          message: string
          retention_tier?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          deliver_on?: string
          delivered_at?: string | null
          delivery_attempts?: number
          delivery_error?: string | null
          id?: string
          message?: string
          retention_tier?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_active_users: {
        Args: { days: number }
        Returns: number
      }
      analytics_summary: {
        Args: { days: number }
        Returns: { event: string; total: number; users: number }[]
      }
      has_premium: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      objective_period: "6_MONTHS" | "1_YEAR" | "5_YEARS" | "10_YEARS"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      objective_period: ["6_MONTHS", "1_YEAR", "5_YEARS", "10_YEARS"],
    },
  },
} as const

export type ObjectivePeriod = Database["public"]["Enums"]["objective_period"]
