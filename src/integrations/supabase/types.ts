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
      product_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_type: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_type: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_type?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          boxes_per_pallet: number | null
          collection: string | null
          created_at: string
          edge: string | null
          factory_rating: string | null
          finish: string | null
          frost_resistant: boolean | null
          google_drive_link: string | null
          id: string
          is_active: boolean | null
          kg_per_box: number | null
          length_mm: number | null
          matching_outdoor_option: boolean | null
          material: string | null
          name: string
          no_tile_faces: string | null
          nominal_size: string | null
          origin: string | null
          price_per_sqm: number
          price_per_tile: number | null
          shape: string | null
          slip_rating: string | null
          sqm_per_box: number | null
          sqm_per_pallet: number | null
          sqm_per_tile: number | null
          stock_allocation: number | null
          stock_sold: number | null
          suitability: string | null
          thickness_mm: number | null
          tile_colour: string | null
          tile_style: string | null
          tiles_per_box: number | null
          underfloor_heating_compatible: boolean | null
          updated_at: string
          width_mm: number | null
        }
        Insert: {
          boxes_per_pallet?: number | null
          collection?: string | null
          created_at?: string
          edge?: string | null
          factory_rating?: string | null
          finish?: string | null
          frost_resistant?: boolean | null
          google_drive_link?: string | null
          id?: string
          is_active?: boolean | null
          kg_per_box?: number | null
          length_mm?: number | null
          matching_outdoor_option?: boolean | null
          material?: string | null
          name: string
          no_tile_faces?: string | null
          nominal_size?: string | null
          origin?: string | null
          price_per_sqm: number
          price_per_tile?: number | null
          shape?: string | null
          slip_rating?: string | null
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_sold?: number | null
          suitability?: string | null
          thickness_mm?: number | null
          tile_colour?: string | null
          tile_style?: string | null
          tiles_per_box?: number | null
          underfloor_heating_compatible?: boolean | null
          updated_at?: string
          width_mm?: number | null
        }
        Update: {
          boxes_per_pallet?: number | null
          collection?: string | null
          created_at?: string
          edge?: string | null
          factory_rating?: string | null
          finish?: string | null
          frost_resistant?: boolean | null
          google_drive_link?: string | null
          id?: string
          is_active?: boolean | null
          kg_per_box?: number | null
          length_mm?: number | null
          matching_outdoor_option?: boolean | null
          material?: string | null
          name?: string
          no_tile_faces?: string | null
          nominal_size?: string | null
          origin?: string | null
          price_per_sqm?: number
          price_per_tile?: number | null
          shape?: string | null
          slip_rating?: string | null
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_sold?: number | null
          suitability?: string | null
          thickness_mm?: number | null
          tile_colour?: string | null
          tile_style?: string | null
          tiles_per_box?: number | null
          underfloor_heating_compatible?: boolean | null
          updated_at?: string
          width_mm?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          admin_notes: string | null
          created_at: string
          delivery_city: string | null
          delivery_door_house: string | null
          delivery_postcode: string
          delivery_street: string | null
          email: string
          held_until: string
          id: string
          name: string
          need_outdoor_tile: boolean | null
          phone: string
          product_id: string
          required_delivery_date: string | null
          required_quantity_sqm: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          delivery_city?: string | null
          delivery_door_house?: string | null
          delivery_postcode: string
          delivery_street?: string | null
          email: string
          held_until: string
          id?: string
          name: string
          need_outdoor_tile?: boolean | null
          phone: string
          product_id: string
          required_delivery_date?: string | null
          required_quantity_sqm: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          delivery_city?: string | null
          delivery_door_house?: string | null
          delivery_postcode?: string
          delivery_street?: string | null
          email?: string
          held_until?: string
          id?: string
          name?: string
          need_outdoor_tile?: boolean | null
          phone?: string
          product_id?: string
          required_delivery_date?: string | null
          required_quantity_sqm?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_orders: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          postcode: string
          product_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          postcode: string
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          postcode?: string
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
