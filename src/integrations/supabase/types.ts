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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string | null
          external_link: string | null
          id: string
          image_url: string | null
          published: boolean | null
          title: string
          updated_at: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          title: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      betting_options: {
        Row: {
          bet_name: string
          category: string
          created_at: string
          id: string
          match_id: string | null
          odds: number
          updated_at: string
        }
        Insert: {
          bet_name: string
          category: string
          created_at?: string
          id?: string
          match_id?: string | null
          odds: number
          updated_at?: string
        }
        Update: {
          bet_name?: string
          category?: string
          created_at?: string
          id?: string
          match_id?: string | null
          odds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "betting_options_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      championships: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          bonus_amount: number
          code: string
          created_at: string | null
          custom_message: string | null
          game_restriction: string | null
          id: string
          minimum_deposit: number | null
          partner_commission: number | null
          partner_email: string | null
          requires_deposit: boolean | null
          updated_at: string | null
          valid_until: string
        }
        Insert: {
          active?: boolean | null
          bonus_amount: number
          code: string
          created_at?: string | null
          custom_message?: string | null
          game_restriction?: string | null
          id?: string
          minimum_deposit?: number | null
          partner_commission?: number | null
          partner_email?: string | null
          requires_deposit?: boolean | null
          updated_at?: string | null
          valid_until: string
        }
        Update: {
          active?: boolean | null
          bonus_amount?: number
          code?: string
          created_at?: string | null
          custom_message?: string | null
          game_restriction?: string | null
          id?: string
          minimum_deposit?: number | null
          partner_commission?: number | null
          partner_email?: string | null
          requires_deposit?: boolean | null
          updated_at?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      deposit_processing_log: {
        Row: {
          deposit_id: string
          processed_at: string
        }
        Insert: {
          deposit_id: string
          processed_at?: string
        }
        Update: {
          deposit_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          id: string
          pix_key: string | null
          qr_code_data: string | null
          status: string | null
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          pix_key?: string | null
          qr_code_data?: string | null
          status?: string | null
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          pix_key?: string | null
          qr_code_data?: string | null
          status?: string | null
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      double_x_game_state: {
        Row: {
          current_multipliers: Json | null
          current_phase: string
          current_result: number | null
          id: number
          phase_ends_at: string
          updated_at: string
        }
        Insert: {
          current_multipliers?: Json | null
          current_phase?: string
          current_result?: number | null
          id?: number
          phase_ends_at?: string
          updated_at?: string
        }
        Update: {
          current_multipliers?: Json | null
          current_phase?: string
          current_result?: number | null
          id?: number
          phase_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      double_x_rounds: {
        Row: {
          created_at: string
          id: string
          multipliers: Json | null
          result: number
          round_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          multipliers?: Json | null
          result: number
          round_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          multipliers?: Json | null
          result?: number
          round_number?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          championship_id: string | null
          created_at: string
          external_id: string | null
          id: string
          match_date: string
          match_time: string
          odds_away: number | null
          odds_draw: number | null
          odds_home: number | null
          team1: string
          team2: string
          updated_at: string
        }
        Insert: {
          championship_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          match_date: string
          match_time: string
          odds_away?: number | null
          odds_draw?: number | null
          odds_home?: number | null
          team1: string
          team2: string
          updated_at?: string
        }
        Update: {
          championship_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          match_date?: string
          match_time?: string
          odds_away?: number | null
          odds_draw?: number | null
          odds_home?: number | null
          team1?: string
          team2?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number | null
          bonus_balance: number | null
          bonus_game_restriction: string | null
          bonus_locked: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_bonus_date: string | null
          referral_id: string | null
          referrer_id: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          balance?: number | null
          bonus_balance?: number | null
          bonus_game_restriction?: string | null
          bonus_locked?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_bonus_date?: string | null
          referral_id?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          balance?: number | null
          bonus_balance?: number | null
          bonus_game_restriction?: string | null
          bonus_locked?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_bonus_date?: string | null
          referral_id?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_paid: boolean | null
          created_at: string
          deposit_made: boolean | null
          id: string
          referred_cpf: string
          referred_user_id: string
          referrer_id: string
          updated_at: string
        }
        Insert: {
          bonus_paid?: boolean | null
          created_at?: string
          deposit_made?: boolean | null
          id?: string
          referred_cpf: string
          referred_user_id: string
          referrer_id: string
          updated_at?: string
        }
        Update: {
          bonus_paid?: boolean | null
          created_at?: string
          deposit_made?: boolean | null
          id?: string
          referred_cpf?: string
          referred_user_id?: string
          referrer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          visitor_count: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          visitor_count?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          visitor_count?: number | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          problem_type: string
          status: string
          updated_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          problem_type: string
          status?: string
          updated_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          problem_type?: string
          status?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          analysis: string
          created_at: string
          date: string
          external_id: string | null
          id: string
          league: string
          match: string
          odds: number | null
          status: string
          team1_logo: string | null
          team2_logo: string | null
          time: string
          tip: string
          updated_at: string
        }
        Insert: {
          analysis: string
          created_at?: string
          date: string
          external_id?: string | null
          id?: string
          league: string
          match: string
          odds?: number | null
          status?: string
          team1_logo?: string | null
          team2_logo?: string | null
          time: string
          tip: string
          updated_at?: string
        }
        Update: {
          analysis?: string
          created_at?: string
          date?: string
          external_id?: string | null
          id?: string
          league?: string
          match?: string
          odds?: number | null
          status?: string
          team1_logo?: string | null
          team2_logo?: string | null
          time?: string
          tip?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_coupon_rollover: {
        Row: {
          completed: boolean | null
          coupon_code: string
          created_at: string | null
          current_rollover: number | null
          game_restriction: string | null
          id: string
          required_rollover: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          coupon_code: string
          created_at?: string | null
          current_rollover?: number | null
          game_restriction?: string | null
          id?: string
          required_rollover: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          coupon_code?: string
          created_at?: string | null
          current_rollover?: number | null
          game_restriction?: string | null
          id?: string
          required_rollover?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          password: string | null
          password_hint: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          password?: string | null
          password_hint?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          password?: string | null
          password_hint?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          mime_type: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          mime_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          duration: number | null
          fake_views: number | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          fake_views?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          fake_views?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          pix_key: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          pix_key: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      apply_coupon: {
        Args: {
          p_coupon_code: string
          p_deposit_amount?: number
          p_user_id: string
        }
        Returns: Json
      }
      apply_coupon_bonus: {
        Args: { p_coupon_id: string; p_user_id: string }
        Returns: undefined
      }
      can_use_coupon: {
        Args: { p_coupon_code: string; p_user_id: string }
        Returns: Json
      }
      cpf_exists: { Args: { cpf_input: string }; Returns: boolean }
      generate_bdc_referral_id: { Args: never; Returns: string }
      generate_fake_views: { Args: { video_uuid: string }; Returns: number }
      generate_referral_id: { Args: { cpf_input: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_views: {
        Args: { article_id: string }
        Returns: undefined
      }
      increment_video_views: { Args: { video_id: string }; Returns: undefined }
      increment_visitor_count: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      process_referral_bonus: {
        Args: { p_deposit_amount: number; p_referred_user_id: string }
        Returns: undefined
      }
      unlock_bonus_after_deposit: {
        Args: { p_deposit_amount: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
