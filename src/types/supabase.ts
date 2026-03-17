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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name_ar: string
          name_en: string
          restaurant_id: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_ar: string
          name_en: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          badge: string | null
          category_id: string
          created_at: string | null
          cross_sell_items: string[] | null
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name_ar: string
          name_en: string
          price: number
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          category_id: string
          created_at?: string | null
          cross_sell_items?: string[] | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name_ar: string
          name_en: string
          price: number
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          category_id?: string
          created_at?: string | null
          cross_sell_items?: string[] | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name_ar?: string
          name_en?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string
          price_at_time: number
          quantity: number
          special_requests: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id: string
          price_at_time: number
          quantity?: number
          special_requests?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string
          price_at_time?: number
          quantity?: number
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          order_number: number
          qr_code_data: string | null
          restaurant_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          order_number?: number
          qr_code_data?: string | null
          restaurant_id: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          order_number?: number
          qr_code_data?: string | null
          restaurant_id?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          table_count: number | null
          theme_colors: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          table_count?: number | null
          theme_colors?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          table_count?: number | null
          theme_colors?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          qr_code_url: string | null
          restaurant_id: string
          section: string | null
          table_number: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          restaurant_id: string
          section?: string | null
          table_number: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          restaurant_id?: string
          section?: string | null
          table_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_calls: {
        Row: {
          created_at: string | null
          id: string
          resolved_at: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["waiter_call_status"]
          table_id: string
          type: Database["public"]["Enums"]["waiter_call_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["waiter_call_status"]
          table_id: string
          type: Database["public"]["Enums"]["waiter_call_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["waiter_call_status"]
          table_id?: string
          type?: Database["public"]["Enums"]["waiter_call_type"]
        }
        Relationships: [
          {
            foreignKeyName: "waiter_calls_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed_by_waiter"
        | "in_kitchen"
        | "ready"
        | "completed"
        | "confirmed"
        | "preparing"
        | "served"
        | "paid"
        | "cancelled"
      waiter_call_status: "active" | "resolved"
      waiter_call_type: "assistance" | "bill"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        "pending",
        "confirmed_by_waiter",
        "in_kitchen",
        "ready",
        "completed",
        "confirmed",
        "preparing",
        "served",
        "paid",
        "cancelled",
      ],
      waiter_call_status: ["active", "resolved"],
      waiter_call_type: ["assistance", "bill"],
    },
  },
} as const
