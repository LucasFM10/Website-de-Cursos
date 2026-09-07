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
      course_access: {
        Row: {
          course_id: string
          created_at: string
          expires_at: string
          id: string
          note: string | null
          revoked: boolean
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          expires_at: string
          id?: string
          note?: string | null
          revoked?: boolean
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          note?: string | null
          revoked?: boolean
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_duration_days: number
          created_at: string
          description: string
          featured: boolean
          id: string
          image_alt: string
          image_key: string | null
          learning_outcomes: string[]
          level: string
          materials: string[]
          price_cents: number
          published: boolean
          short_description: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          access_duration_days?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_key?: string | null
          learning_outcomes?: string[]
          level?: string
          materials?: string[]
          price_cents?: number
          published?: boolean
          short_description?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          access_duration_days?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_key?: string | null
          learning_outcomes?: string[]
          level?: string
          materials?: string[]
          price_cents?: number
          published?: boolean
          short_description?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          bunny_video_id: string | null
          created_at: string
          description: string
          duration_minutes: number
          free_preview: boolean
          id: string
          module_id: string
          position: number
          title: string
          updated_at: string
          video_status: string
        }
        Insert: {
          bunny_video_id?: string | null
          created_at?: string
          description?: string
          duration_minutes?: number
          free_preview?: boolean
          id?: string
          module_id: string
          position?: number
          title: string
          updated_at?: string
          video_status?: string
        }
        Update: {
          bunny_video_id?: string | null
          created_at?: string
          description?: string
          duration_minutes?: number
          free_preview?: boolean
          id?: string
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
          video_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          access_duration_days: number | null
          course_id: string | null
          created_at: string
          id: string
          item_type: string
          order_id: string
          product_id: string | null
          quantity: number
          title: string
          unit_price_cents: number
        }
        Insert: {
          access_duration_days?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          item_type: string
          order_id: string
          product_id?: string | null
          quantity?: number
          title: string
          unit_price_cents?: number
        }
        Update: {
          access_duration_days?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          item_type?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          title?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          fulfillment_status: string
          id: string
          notes: string
          paid_at: string | null
          payment_external_id: string | null
          payment_payload: Json | null
          payment_provider: string
          payment_status: string
          requires_shipping: boolean
          shipping_address: string
          shipping_cents: number
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          fulfillment_status?: string
          id?: string
          notes?: string
          paid_at?: string | null
          payment_external_id?: string | null
          payment_payload?: Json | null
          payment_provider?: string
          payment_status?: string
          requires_shipping?: boolean
          shipping_address?: string
          shipping_cents?: number
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          fulfillment_status?: string
          id?: string
          notes?: string
          paid_at?: string | null
          payment_external_id?: string | null
          payment_payload?: Json | null
          payment_provider?: string
          payment_status?: string
          requires_shipping?: boolean
          shipping_address?: string
          shipping_cents?: number
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          availability: string
          created_at: string
          description: string
          dimensions: string
          featured: boolean
          id: string
          image_alt: string
          image_key: string | null
          materials: string[]
          name: string
          price_cents: number
          production_days: number | null
          published: boolean
          short_description: string
          slug: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          availability?: string
          created_at?: string
          description?: string
          dimensions?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_key?: string | null
          materials?: string[]
          name: string
          price_cents?: number
          production_days?: number | null
          published?: boolean
          short_description?: string
          slug: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          availability?: string
          created_at?: string
          description?: string
          dimensions?: string
          featured?: boolean
          id?: string
          image_alt?: string
          image_key?: string | null
          materials?: string[]
          name?: string
          price_cents?: number
          production_days?: number | null
          published?: boolean
          short_description?: string
          slug?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
      cancel_order_payment: { Args: { _order_id: string }; Returns: undefined }
      confirm_order_payment: {
        Args: { _external_id?: string; _order_id: string }
        Returns: undefined
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
