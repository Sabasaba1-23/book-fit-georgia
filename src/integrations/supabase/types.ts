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
      badges: {
        Row: {
          auto_criteria: Json | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          key: string
          tier: Database["public"]["Enums"]["badge_tier"]
          title: string
          visibility_priority: number
        }
        Insert: {
          auto_criteria?: Json | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          tier: Database["public"]["Enums"]["badge_tier"]
          title: string
          visibility_priority?: number
        }
        Update: {
          auto_criteria?: Json | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          tier?: Database["public"]["Enums"]["badge_tier"]
          title?: string
          visibility_priority?: number
        }
        Relationships: []
      }
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
      entity_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_key: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["badge_entity_type"]
          id: string
          notes: string | null
          revoked_at: string | null
          source: Database["public"]["Enums"]["badge_source"]
          status: Database["public"]["Enums"]["badge_status"]
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_key: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["badge_entity_type"]
          id?: string
          notes?: string | null
          revoked_at?: string | null
          source?: Database["public"]["Enums"]["badge_source"]
          status?: Database["public"]["Enums"]["badge_status"]
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_key?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["badge_entity_type"]
          id?: string
          notes?: string | null
          revoked_at?: string | null
          source?: Database["public"]["Enums"]["badge_source"]
          status?: Database["public"]["Enums"]["badge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "entity_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["key"]
          },
        ]
      }
      gym_trainers: {
        Row: {
          added_at: string
          gym_partner_id: string
          id: string
          status: string
          trainer_partner_id: string
        }
        Insert: {
          added_at?: string
          gym_partner_id: string
          id?: string
          status?: string
          trainer_partner_id: string
        }
        Update: {
          added_at?: string
          gym_partner_id?: string
          id?: string
          status?: string
          trainer_partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_trainers_gym_partner_id_fkey"
            columns: ["gym_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_trainers_trainer_partner_id_fkey"
            columns: ["trainer_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
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
      partner_locations: {
        Row: {
          address: string
          created_at: string
          description: string | null
          id: string
          is_primary: boolean
          label: string
          latitude: number | null
          longitude: number | null
          partner_id: string
          sort_order: number
        }
        Insert: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          partner_id: string
          sort_order?: number
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          partner_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_locations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_media: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_featured: boolean
          partner_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_featured?: boolean
          partner_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          partner_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_media_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          account_holder: string | null
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          partner_id: string
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          partner_id: string
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          partner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
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
          gender: string | null
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
          gender?: string | null
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
          gender?: string | null
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
      partner_subscriptions: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          period_end: string | null
          period_start: string | null
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_verifications: {
        Row: {
          address: string | null
          admin_notes: string | null
          biz_status: string | null
          business_type: string | null
          country_city: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          partner_id: string
          personal_id_number: string | null
          professional_description: string | null
          rep_status: string | null
          representative_role: string | null
          reviewed_at: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_tiktok: string | null
          specializations: string[] | null
          submitted_at: string | null
          trainer_type: string | null
          updated_at: string
          verification_step: number | null
          website_social: string | null
          whatsapp: string | null
          years_experience: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          biz_status?: string | null
          business_type?: string | null
          country_city?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          partner_id: string
          personal_id_number?: string | null
          professional_description?: string | null
          rep_status?: string | null
          representative_role?: string | null
          reviewed_at?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          specializations?: string[] | null
          submitted_at?: string | null
          trainer_type?: string | null
          updated_at?: string
          verification_step?: number | null
          website_social?: string | null
          whatsapp?: string | null
          years_experience?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          biz_status?: string | null
          business_type?: string | null
          country_city?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          partner_id?: string
          personal_id_number?: string | null
          professional_description?: string | null
          rep_status?: string | null
          representative_role?: string | null
          reviewed_at?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          specializations?: string[] | null
          submitted_at?: string | null
          trainer_type?: string | null
          updated_at?: string
          verification_step?: number | null
          website_social?: string | null
          whatsapp?: string | null
          years_experience?: string | null
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
          gender: string | null
          id: string
          language_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          language_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
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
          goals: string[] | null
          gym_facebook: string | null
          gym_instagram: string | null
          gym_name: string | null
          id: string
          language: string
          location: string | null
          location_type: string | null
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
          goals?: string[] | null
          gym_facebook?: string | null
          gym_instagram?: string | null
          gym_name?: string | null
          id?: string
          language?: string
          location?: string | null
          location_type?: string | null
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
          goals?: string[] | null
          gym_facebook?: string | null
          gym_instagram?: string | null
          gym_name?: string | null
          id?: string
          language?: string
          location?: string | null
          location_type?: string | null
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
          goals: string[] | null
          gym_facebook: string | null
          gym_instagram: string | null
          gym_name: string | null
          id: string
          location: string | null
          location_type: string | null
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
          goals?: string[] | null
          gym_facebook?: string | null
          gym_instagram?: string | null
          gym_name?: string | null
          id?: string
          location?: string | null
          location_type?: string | null
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
          goals?: string[] | null
          gym_facebook?: string | null
          gym_instagram?: string | null
          gym_name?: string | null
          id?: string
          location?: string | null
          location_type?: string | null
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
      create_thread_with_participants: {
        Args: {
          p_listing_id: string
          p_other_user_id: string
          p_user_id: string
        }
        Returns: string
      }
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
      badge_entity_type: "trainer" | "studio" | "user"
      badge_source: "manual_admin" | "auto_system"
      badge_status: "active" | "pending" | "revoked"
      badge_tier: "trust" | "experience" | "performance" | "loyalty"
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
      badge_entity_type: ["trainer", "studio", "user"],
      badge_source: ["manual_admin", "auto_system"],
      badge_status: ["active", "pending", "revoked"],
      badge_tier: ["trust", "experience", "performance", "loyalty"],
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
