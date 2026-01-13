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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          opportunity_id: string
          status: string | null
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          status?: string | null
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          status?: string | null
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_feedback: {
        Row: {
          communication_score: number | null
          confidence_score: number | null
          created_at: string
          fear_reduction_score: number | null
          final_verdict: string | null
          fluency_score: number | null
          grammar_score: number | null
          hesitation_count: number | null
          id: string
          improvement_advice: string | null
          improvements: string[] | null
          problem_solving_score: number | null
          session_id: string
          strengths: string[] | null
          technical_score: number | null
          voice_clarity_score: number | null
          words_per_minute: number | null
        }
        Insert: {
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string
          fear_reduction_score?: number | null
          final_verdict?: string | null
          fluency_score?: number | null
          grammar_score?: number | null
          hesitation_count?: number | null
          id?: string
          improvement_advice?: string | null
          improvements?: string[] | null
          problem_solving_score?: number | null
          session_id: string
          strengths?: string[] | null
          technical_score?: number | null
          voice_clarity_score?: number | null
          words_per_minute?: number | null
        }
        Update: {
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string
          fear_reduction_score?: number | null
          final_verdict?: string | null
          fluency_score?: number | null
          grammar_score?: number | null
          hesitation_count?: number | null
          id?: string
          improvement_advice?: string | null
          improvements?: string[] | null
          problem_solving_score?: number | null
          session_id?: string
          strengths?: string[] | null
          technical_score?: number | null
          voice_clarity_score?: number | null
          words_per_minute?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          company: string | null
          created_at: string
          difficulty: string
          ended_at: string | null
          id: string
          interview_type: string
          job_role: string
          overall_score: number | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
          voice_enabled: boolean | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          interview_type?: string
          job_role: string
          overall_score?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          voice_enabled?: boolean | null
        }
        Update: {
          company?: string | null
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          interview_type?: string
          job_role?: string
          overall_score?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          commitment_type: string
          created_at: string
          description: string
          end_date: string | null
          hours_per_week: number | null
          id: string
          is_remote: boolean | null
          location: string
          ngo_id: string
          skills_required: string[] | null
          spots_available: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          commitment_type: string
          created_at?: string
          description: string
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          is_remote?: boolean | null
          location: string
          ngo_id: string
          skills_required?: string[] | null
          spots_available?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          commitment_type?: string
          created_at?: string
          description?: string
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          is_remote?: boolean | null
          location?: string
          ngo_id?: string
          skills_required?: string[] | null
          spots_available?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_application_updates: boolean | null
          email_new_applications: boolean | null
          email_new_messages: boolean | null
          experience_years: number | null
          founded_year: number | null
          full_name: string
          id: string
          location: string | null
          mission: string | null
          organization_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          team_size: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_application_updates?: boolean | null
          email_new_applications?: boolean | null
          email_new_messages?: boolean | null
          experience_years?: number | null
          founded_year?: number | null
          full_name: string
          id?: string
          location?: string | null
          mission?: string | null
          organization_name?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          team_size?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_application_updates?: boolean | null
          email_new_applications?: boolean | null
          email_new_messages?: boolean | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string
          id?: string
          location?: string | null
          mission?: string | null
          organization_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          founded_year: number | null
          full_name: string | null
          id: string | null
          location: string | null
          mission: string | null
          organization_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          skills: string[] | null
          team_size: number | null
          website: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          mission?: string | null
          organization_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          skills?: string[] | null
          team_size?: number | null
          website?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          mission?: string | null
          organization_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          skills?: string[] | null
          team_size?: number | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_profile_fields: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: Json
      }
      user_owns_notification: {
        Args: { notification_user_id: string }
        Returns: boolean
      }
      user_owns_profile: { Args: { profile_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: "volunteer" | "ngo"
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
      user_role: ["volunteer", "ngo"],
    },
  },
} as const
