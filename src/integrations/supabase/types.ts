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
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"]
          created_at: string
          id: string
          listing_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          spots: number
          stripe_payment_id: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          id?: string
          listing_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          spots?: number
          stripe_payment_id?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          id?: string
          listing_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          spots?: number
          stripe_payment_id?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "training_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_requests: {
        Row: {
          auto_complete_at: string | null
          booking_id: string
          created_at: string
          id: string
          partner_confirmed_at: string | null
          partner_status: Database["public"]["Enums"]["confirmation_status"]
          reminder_sent_at: string | null
          updated_at: string
          user_confirmed_at: string | null
          user_status: Database["public"]["Enums"]["confirmation_status"]
        }
        Insert: {
          auto_complete_at?: string | null
          booking_id: string
          created_at?: string
          id?: string
          partner_confirmed_at?: string | null
          partner_status?: Database["public"]["Enums"]["confirmation_status"]
          reminder_sent_at?: string | null
          updated_at?: string
          user_confirmed_at?: string | null
          user_status?: Database["public"]["Enums"]["confirmation_status"]
        }
        Update: {
          auto_complete_at?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          partner_confirmed_at?: string | null
          partner_status?: Database["public"]["Enums"]["confirmation_status"]
          reminder_sent_at?: string | null
          updated_at?: string
          user_confirmed_at?: string | null
          user_status?: Database["public"]["Enums"]["confirmation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "completion_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "training_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          sender_id: string
          sent_at: string
          thread_id: string
        }
        Insert: {
          content: string
          id?: string
          sender_id: string
          sent_at?: string
          thread_id: string
        }
        Update: {
          content?: string
          id?: string
          sender_id?: string
          sent_at?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          admin_notes: string | null
          document_type: string
          document_url: string
          file_name: string | null
          id: string
          partner_id: string
          reviewed_at: string | null
          status: string
          uploaded_at: string
        }
        Insert: {
          admin_notes?: string | null
          document_type: string
          document_url: string
          file_name?: string | null
          id?: string
          partner_id: string
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string
        }
        Update: {
          admin_notes?: string | null
          document_type?: string
          document_url?: string
          file_name?: string | null
          id?: string
          partner_id?: string
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          approved: boolean
          avg_rating: number | null
          bio: string | null
          completion_rate: number | null
          created_at: string
          display_name: string
          dispute_rate: number | null
          id: string
          languages: string[] | null
          location: string | null
          logo_url: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone_number: string | null
          review_count: number | null
          sports: string[] | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          approved?: boolean
          avg_rating?: number | null
          bio?: string | null
          completion_rate?: number | null
          created_at?: string
          display_name: string
          dispute_rate?: number | null
          id?: string
          languages?: string[] | null
          location?: string | null
          logo_url?: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone_number?: string | null
          review_count?: number | null
          sports?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          approved?: boolean
          avg_rating?: number | null
          bio?: string | null
          completion_rate?: number | null
          created_at?: string
          display_name?: string
          dispute_rate?: number | null
          id?: string
          languages?: string[] | null
          location?: string | null
          logo_url?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone_number?: string | null
          review_count?: number | null
          sports?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      partner_verifications: {
        Row: {
          address: string | null
          admin_notes: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          partner_id: string
          personal_id_number: string | null
          reviewed_at: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_tiktok: string | null
          submitted_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          partner_id: string
          personal_id_number?: string | null
          reviewed_at?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          submitted_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          partner_id?: string
          personal_id_number?: string | null
          reviewed_at?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          submitted_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_verifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          photos: string[] | null
          rating: number
          review_text: string | null
          reviewer_id: string
          reviewer_role: string
          tags: string[] | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          photos?: string[] | null
          rating: number
          review_text?: string | null
          reviewer_id: string
          reviewer_role: string
          tags?: string[] | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          reviewer_role?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      session_issues: {
        Row: {
          admin_note: string | null
          booking_id: string
          created_at: string
          id: string
          note: string | null
          reason: string
          reporter_id: string
          reporter_role: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          booking_id: string
          created_at?: string
          id?: string
          note?: string | null
          reason: string
          reporter_id: string
          reporter_role: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          reporter_id?: string
          reporter_role?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_issues_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_listings: {
        Row: {
          admin_notes: string | null
          background_image_url: string | null
          created_at: string
          description_en: string | null
          description_ka: string | null
          difficulty_level: string | null
          duration_minutes: number
          equipment_notes_en: string | null
          equipment_notes_ka: string | null
          id: string
          language: string
          location: string | null
          max_spots: number
          partner_id: string
          price_gel: number
          rental_info_en: string | null
          rental_info_ka: string | null
          scheduled_at: string
          sport: string
          status: Database["public"]["Enums"]["listing_status"]
          title_en: string
          title_ka: string | null
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          background_image_url?: string | null
          created_at?: string
          description_en?: string | null
          description_ka?: string | null
          difficulty_level?: string | null
          duration_minutes?: number
          equipment_notes_en?: string | null
          equipment_notes_ka?: string | null
          id?: string
          language?: string
          location?: string | null
          max_spots?: number
          partner_id: string
          price_gel: number
          rental_info_en?: string | null
          rental_info_ka?: string | null
          scheduled_at: string
          sport: string
          status?: Database["public"]["Enums"]["listing_status"]
          title_en: string
          title_ka?: string | null
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          background_image_url?: string | null
          created_at?: string
          description_en?: string | null
          description_ka?: string | null
          difficulty_level?: string | null
          duration_minutes?: number
          equipment_notes_en?: string | null
          equipment_notes_ka?: string | null
          id?: string
          language?: string
          location?: string | null
          max_spots?: number
          partner_id?: string
          price_gel?: number
          rental_info_en?: string | null
          rental_info_ka?: string | null
          scheduled_at?: string
          sport?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title_en?: string
          title_ka?: string | null
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_listings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_packages: {
        Row: {
          background_image_url: string | null
          created_at: string
          description_en: string | null
          description_ka: string | null
          difficulty_level: string | null
          duration_minutes: number
          id: string
          location: string | null
          max_spots: number
          partner_id: string
          price_per_session_gel: number
          rental_info_en: string | null
          rental_info_ka: string | null
          sessions_count: number
          sport: string
          status: Database["public"]["Enums"]["listing_status"]
          title_en: string
          title_ka: string | null
          total_price_gel: number
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          description_en?: string | null
          description_ka?: string | null
          difficulty_level?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          max_spots?: number
          partner_id: string
          price_per_session_gel: number
          rental_info_en?: string | null
          rental_info_ka?: string | null
          sessions_count?: number
          sport: string
          status?: Database["public"]["Enums"]["listing_status"]
          title_en: string
          title_ka?: string | null
          total_price_gel: number
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          description_en?: string | null
          description_ka?: string | null
          difficulty_level?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          max_spots?: number
          partner_id?: string
          price_per_session_gel?: number
          rental_info_en?: string | null
          rental_info_ka?: string | null
          sessions_count?: number
          sport?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title_en?: string
          title_ka?: string | null
          total_price_gel?: number
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_packages_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "disputed"
      confirmation_status: "pending" | "confirmed" | "disputed"
      issue_status: "open" | "under_review" | "resolved" | "dismissed"
      listing_status: "draft" | "pending" | "approved" | "rejected"
      partner_type: "individual" | "gym"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      training_type: "one_on_one" | "group" | "event"
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
      app_role: ["admin", "partner", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "disputed",
      ],
      confirmation_status: ["pending", "confirmed", "disputed"],
      issue_status: ["open", "under_review", "resolved", "dismissed"],
      listing_status: ["draft", "pending", "approved", "rejected"],
      partner_type: ["individual", "gym"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      training_type: ["one_on_one", "group", "event"],
    },
  },
} as const
