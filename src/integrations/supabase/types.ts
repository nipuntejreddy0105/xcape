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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      games: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          code: string
          created_at: string | null
          current_radius_m: number | null
          headstart_min: number | null
          host_id: string | null
          hunter_count: number | null
          hunters_can_talk: boolean | null
          id: string
          initial_radius_m: number | null
          min_radius_m: number | null
          ping_interval_min: number | null
          play_zone_enabled: boolean | null
          role_assignment_mode: string | null
          round_length_min: number | null
          shrink_interval_min: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          code: string
          created_at?: string | null
          current_radius_m?: number | null
          headstart_min?: number | null
          host_id?: string | null
          hunter_count?: number | null
          hunters_can_talk?: boolean | null
          id?: string
          initial_radius_m?: number | null
          min_radius_m?: number | null
          ping_interval_min?: number | null
          play_zone_enabled?: boolean | null
          role_assignment_mode?: string | null
          round_length_min?: number | null
          shrink_interval_min?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          code?: string
          created_at?: string | null
          current_radius_m?: number | null
          headstart_min?: number | null
          host_id?: string | null
          hunter_count?: number | null
          hunters_can_talk?: boolean | null
          id?: string
          initial_radius_m?: number | null
          min_radius_m?: number | null
          ping_interval_min?: number | null
          play_zone_enabled?: boolean | null
          role_assignment_mode?: string | null
          round_length_min?: number | null
          shrink_interval_min?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          accuracy: number | null
          avatar_url: string | null
          game_id: string | null
          id: string
          is_outside_zone: boolean | null
          is_ready: boolean | null
          is_tagged: boolean | null
          last_ping_lat: number | null
          last_ping_lng: number | null
          lat: number | null
          lng: number | null
          name: string
          role: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          accuracy?: number | null
          avatar_url?: string | null
          game_id?: string | null
          id?: string
          is_outside_zone?: boolean | null
          is_ready?: boolean | null
          is_tagged?: boolean | null
          last_ping_lat?: number | null
          last_ping_lng?: number | null
          lat?: number | null
          lng?: number | null
          name: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          accuracy?: number | null
          avatar_url?: string | null
          game_id?: string | null
          id?: string
          is_outside_zone?: boolean | null
          is_ready?: boolean | null
          is_tagged?: boolean | null
          last_ping_lat?: number | null
          last_ping_lng?: number | null
          lat?: number | null
          lng?: number | null
          name?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          host_code: string
          id: string
          longest_run_sec: number | null
          name: string | null
          never_caught: number | null
          rounds_played: number | null
          rounds_won: number | null
          theme: string | null
          units: string | null
          updated_at: string
          updates_email: boolean
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          host_code?: string
          id: string
          longest_run_sec?: number | null
          name?: string | null
          never_caught?: number | null
          rounds_played?: number | null
          rounds_won?: number | null
          theme?: string | null
          units?: string | null
          updated_at?: string
          updates_email?: boolean
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          host_code?: string
          id?: string
          longest_run_sec?: number | null
          name?: string | null
          never_caught?: number | null
          rounds_played?: number | null
          rounds_won?: number | null
          theme?: string | null
          units?: string | null
          updated_at?: string
          updates_email?: boolean
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enter_lobby: {
        Args: { player_name: string; room_code?: string }
        Returns: string
      }
      is_room_member: { Args: { room_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
