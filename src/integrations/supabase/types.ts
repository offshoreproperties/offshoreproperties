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
      agents: {
        Row: {
          agency: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          agency?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          agency?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agent_id: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          duration_minutes: number
          google_event_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          property_id: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id?: string | null
          requested_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          related_id: string | null
          related_type: string | null
          resend_message_id: string | null
          status: string
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          resend_message_id?: string | null
          status?: string
          template: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          resend_message_id?: string | null
          status?: string
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          agent_id: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          message: string | null
          notes: string | null
          property_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          property_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          property_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          agent_id: string | null
          area_sqm: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          description: string | null
          features: string[]
          furnishing_status: string | null
          hero_image: string | null
          id: string
          images: string[]
          is_featured: boolean
          is_published: boolean
          listing_badges: string[]
          latitude: number | null
          listing_type: string
          longitude: number | null
          parking_spaces: number | null
          plot_size_sqm: number | null
          price: number
          property_type: string
          short_let_min_nights: number | null
          slug: string | null
          status: string
          title: string
          updated_at: string
          view_count: number
          year_built: number | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: string[]
          furnishing_status?: string | null
          hero_image?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          listing_badges?: string[]
          latitude?: number | null
          listing_type?: string
          longitude?: number | null
          parking_spaces?: number | null
          plot_size_sqm?: number | null
          price: number
          property_type: string
          short_let_min_nights?: number | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number
          year_built?: number | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: string[]
          furnishing_status?: string | null
          hero_image?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          listing_badges?: string[]
          latitude?: number | null
          listing_type?: string
          longitude?: number | null
          parking_spaces?: number | null
          plot_size_sqm?: number | null
          price?: number
          property_type?: string
          short_let_min_nights?: number | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      property_drafts: {
        Row: {
          created_at: string
          id: string
          label: string
          payload: Json
          property_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          payload?: Json
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          payload?: Json
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          referrer: string | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          referrer?: string | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          referrer?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_property_likes: {
        Row: {
          created_at: string
          property_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_property_likes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_property_saves: {
        Row: {
          created_at: string
          property_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_property_saves_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_likes: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_likes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_saves: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_saves_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
        }
        Relationships: []
      }
      oauth_admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_oauth_admin_email: {
        Args: { _email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
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
      app_role: ["admin", "agent"],
    },
  },
} as const
