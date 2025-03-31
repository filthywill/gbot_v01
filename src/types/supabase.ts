export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      presets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          name: string
          description: string | null
          options: Json
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          name: string
          description?: string | null
          options: Json
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          name?: string
          description?: string | null
          options?: Json
          is_public?: boolean
        }
      }
      user_actions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action_type: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action_type: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action_type?: string
          metadata?: Json | null
        }
      }
      user_feature_access: {
        Row: {
          id: string
          created_at: string
          user_id: string
          feature: string
          access_level: string
          expiration_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          feature: string
          access_level: string
          expiration_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          feature?: string
          access_level?: string
          expiration_date?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_type: 'preset_click' | 'submit' | 'create_preset' | 'export_png' | 'export_svg'
      access_level: 'free' | 'premium' | 'admin'
    }
  }
} 