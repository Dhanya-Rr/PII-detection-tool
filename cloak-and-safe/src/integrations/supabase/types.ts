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
      database_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          database_name: string
          db_type: string
          host: string
          id: string
          port: string
          project_id: string
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          database_name: string
          db_type: string
          host: string
          id?: string
          port: string
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          database_name?: string
          db_type?: string
          host?: string
          id?: string
          port?: string
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "database_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      database_tables: {
        Row: {
          column_count: number | null
          connection_id: string
          created_at: string
          id: string
          last_scanned_at: string | null
          project_id: string
          row_count: number | null
          table_name: string
          user_id: string
        }
        Insert: {
          column_count?: number | null
          connection_id: string
          created_at?: string
          id?: string
          last_scanned_at?: string | null
          project_id: string
          row_count?: number | null
          table_name: string
          user_id: string
        }
        Update: {
          column_count?: number | null
          connection_id?: string
          created_at?: string
          id?: string
          last_scanned_at?: string | null
          project_id?: string
          row_count?: number | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "database_tables_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "database_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "database_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_pii_fields: {
        Row: {
          confidence: number | null
          created_at: string
          field_name: string
          field_type: string
          id: string
          project_id: string
          scan_id: string
          table_name: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          field_name: string
          field_type: string
          id?: string
          project_id: string
          scan_id: string
          table_name?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          project_id?: string
          scan_id?: string
          table_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_pii_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pii_fields_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "pii_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      masking_history: {
        Row: {
          created_at: string
          fields_masked: Json
          id: string
          project_id: string
          protection_method: string
          records_processed: number | null
          status: string
          technique: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fields_masked?: Json
          id?: string
          project_id: string
          protection_method: string
          records_processed?: number | null
          status?: string
          technique: string
          user_id: string
        }
        Update: {
          created_at?: string
          fields_masked?: Json
          id?: string
          project_id?: string
          protection_method?: string
          records_processed?: number | null
          status?: string
          technique?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "masking_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          pii_fields_found: number | null
          project_id: string
          scan_status: string
          started_at: string | null
          table_id: string | null
          total_fields_scanned: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          pii_fields_found?: number | null
          project_id: string
          scan_status?: string
          started_at?: string | null
          table_id?: string | null
          total_fields_scanned?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          pii_fields_found?: number | null
          project_id?: string
          scan_status?: string
          started_at?: string | null
          table_id?: string | null
          total_fields_scanned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pii_scans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pii_scans_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "database_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          created_at: string
          current_step: number | null
          has_completed_wizard: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          has_completed_wizard?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number | null
          has_completed_wizard?: boolean
          id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
