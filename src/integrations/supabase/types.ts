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
      delivery_zones: {
        Row: {
          created_at: string
          id: string
          luxury_message: string
          surcharge_per_sqm: number
          surcharge_type: Database["public"]["Enums"]["surcharge_type"]
          tier_code: string
          tier_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          luxury_message: string
          surcharge_per_sqm?: number
          surcharge_type?: Database["public"]["Enums"]["surcharge_type"]
          tier_code: string
          tier_label: string
        }
        Update: {
          created_at?: string
          id?: string
          luxury_message?: string
          surcharge_per_sqm?: number
          surcharge_type?: Database["public"]["Enums"]["surcharge_type"]
          tier_code?: string
          tier_label?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          email_type: string
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          related_id: string | null
          related_table: string | null
          resend_id: string | null
          status: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          related_id?: string | null
          related_table?: string | null
          resend_id?: string | null
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          related_id?: string | null
          related_table?: string | null
          resend_id?: string | null
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      interest_submissions: {
        Row: {
          created_at: string
          delivery_postcode: string | null
          email: string
          estimated_quantity: string | null
          id: string
          name: string | null
          product_name: string | null
          tel: string | null
        }
        Insert: {
          created_at?: string
          delivery_postcode?: string | null
          email: string
          estimated_quantity?: string | null
          id?: string
          name?: string | null
          product_name?: string | null
          tel?: string | null
        }
        Update: {
          created_at?: string
          delivery_postcode?: string | null
          email?: string
          estimated_quantity?: string | null
          id?: string
          name?: string | null
          product_name?: string | null
          tel?: string | null
        }
        Relationships: []
      }
      postcode_checks: {
        Row: {
          created_at: string
          extracted_area: string | null
          extracted_district: string | null
          id: string
          matched_rule_id: string | null
          normalized_postcode: string
          raw_postcode_input: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_area?: string | null
          extracted_district?: string | null
          id?: string
          matched_rule_id?: string | null
          normalized_postcode: string
          raw_postcode_input: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_area?: string | null
          extracted_district?: string | null
          id?: string
          matched_rule_id?: string | null
          normalized_postcode?: string
          raw_postcode_input?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postcode_checks_matched_rule_id_fkey"
            columns: ["matched_rule_id"]
            isOneToOne: false
            referencedRelation: "postcode_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_checks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      postcode_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          match_type: Database["public"]["Enums"]["match_type"]
          pattern: string
          priority: number
          zone_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          match_type: Database["public"]["Enums"]["match_type"]
          pattern: string
          priority?: number
          zone_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type"]
          pattern?: string
          priority?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postcode_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
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
      product_variants: {
        Row: {
          boxes_per_pallet: number | null
          created_at: string
          data_sheet_url: string | null
          display_order: number | null
          id: string
          kg_per_box: number | null
          length_mm: number | null
          nominal_size: string | null
          price_per_sqm: number | null
          price_per_tile: number | null
          product_id: string
          sqm_per_box: number | null
          sqm_per_pallet: number | null
          sqm_per_tile: number | null
          stock_allocation: number | null
          stock_reserved_manual: number | null
          stock_sold: number | null
          thickness_mm: number | null
          tiles_per_box: number | null
          variant_label: string
          width_mm: number | null
        }
        Insert: {
          boxes_per_pallet?: number | null
          created_at?: string
          data_sheet_url?: string | null
          display_order?: number | null
          id?: string
          kg_per_box?: number | null
          length_mm?: number | null
          nominal_size?: string | null
          price_per_sqm?: number | null
          price_per_tile?: number | null
          product_id: string
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_reserved_manual?: number | null
          stock_sold?: number | null
          thickness_mm?: number | null
          tiles_per_box?: number | null
          variant_label: string
          width_mm?: number | null
        }
        Update: {
          boxes_per_pallet?: number | null
          created_at?: string
          data_sheet_url?: string | null
          display_order?: number | null
          id?: string
          kg_per_box?: number | null
          length_mm?: number | null
          nominal_size?: string | null
          price_per_sqm?: number | null
          price_per_tile?: number | null
          product_id?: string
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_reserved_manual?: number | null
          stock_sold?: number | null
          thickness_mm?: number | null
          tiles_per_box?: number | null
          variant_label?: string
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
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
          data_sheet_url: string | null
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
          min_order_sqm: number | null
          name: string
          no_tile_faces: string | null
          nominal_size: string | null
          origin: string | null
          page_type: string
          price_per_sqm: number | null
          price_per_tile: number | null
          product_category: string
          samples_chargeable: boolean
          shape: string | null
          slip_rating: string | null
          slug: string | null
          sqm_per_box: number | null
          sqm_per_pallet: number | null
          sqm_per_tile: number | null
          stock_allocation: number | null
          stock_reserved_manual: number | null
          stock_sold: number | null
          suitability: string | null
          thickness_mm: number | null
          tile_colour: string | null
          tile_style: string | null
          tiles_per_box: number | null
          underfloor_heating_compatible: boolean | null
          updated_at: string
          wear_layer_mm: number | null
          width_mm: number | null
        }
        Insert: {
          boxes_per_pallet?: number | null
          collection?: string | null
          created_at?: string
          data_sheet_url?: string | null
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
          min_order_sqm?: number | null
          name: string
          no_tile_faces?: string | null
          nominal_size?: string | null
          origin?: string | null
          page_type?: string
          price_per_sqm?: number | null
          price_per_tile?: number | null
          product_category?: string
          samples_chargeable?: boolean
          shape?: string | null
          slip_rating?: string | null
          slug?: string | null
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_reserved_manual?: number | null
          stock_sold?: number | null
          suitability?: string | null
          thickness_mm?: number | null
          tile_colour?: string | null
          tile_style?: string | null
          tiles_per_box?: number | null
          underfloor_heating_compatible?: boolean | null
          updated_at?: string
          wear_layer_mm?: number | null
          width_mm?: number | null
        }
        Update: {
          boxes_per_pallet?: number | null
          collection?: string | null
          created_at?: string
          data_sheet_url?: string | null
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
          min_order_sqm?: number | null
          name?: string
          no_tile_faces?: string | null
          nominal_size?: string | null
          origin?: string | null
          page_type?: string
          price_per_sqm?: number | null
          price_per_tile?: number | null
          product_category?: string
          samples_chargeable?: boolean
          shape?: string | null
          slip_rating?: string | null
          slug?: string | null
          sqm_per_box?: number | null
          sqm_per_pallet?: number | null
          sqm_per_tile?: number | null
          stock_allocation?: number | null
          stock_reserved_manual?: number | null
          stock_sold?: number | null
          suitability?: string | null
          thickness_mm?: number | null
          tile_colour?: string | null
          tile_style?: string | null
          tiles_per_box?: number | null
          underfloor_heating_compatible?: boolean | null
          updated_at?: string
          wear_layer_mm?: number | null
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
          dispatched_at: string | null
          email: string
          id: string
          name: string
          phone: string
          postcode: string
          product_id: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          dispatched_at?: string | null
          email: string
          id?: string
          name: string
          phone: string
          postcode: string
          product_id?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          dispatched_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
          postcode?: string
          product_id?: string | null
          status?: string
          tracking_number?: string | null
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
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      match_type: "DISTRICT" | "AREA"
      surcharge_type: "none" | "per_sqm" | "quote_required"
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
      match_type: ["DISTRICT", "AREA"],
      surcharge_type: ["none", "per_sqm", "quote_required"],
    },
  },
} as const
