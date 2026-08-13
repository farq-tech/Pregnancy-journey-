/**
 * Generated from the Supabase project schema.
 * Regenerate with: npx supabase gen types typescript --project-id memewgpjbuurtrzcqgtu
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          date: string;
          doctor: string;
          done: boolean;
          id: string;
          location: string;
          notes: string;
          reminder: string;
          time: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          doctor?: string;
          done?: boolean;
          id?: string;
          location?: string;
          notes?: string;
          reminder?: string;
          time?: string | null;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          doctor?: string;
          done?: boolean;
          id?: string;
          location?: string;
          notes?: string;
          reminder?: string;
          time?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          body: string;
          created_at: string;
          date: string;
          id: string;
          mood: string;
          symptoms: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          body?: string;
          created_at?: string;
          date: string;
          id?: string;
          mood?: string;
          symptoms?: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          date?: string;
          id?: string;
          mood?: string;
          symptoms?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          baby_name: string;
          created_at: string;
          cycle_length: number;
          doctor: string;
          edd_override: string | null;
          id: string;
          lmp: string;
          mother_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          baby_name?: string;
          created_at?: string;
          cycle_length?: number;
          doctor?: string;
          edd_override?: string | null;
          id: string;
          lmp: string;
          mother_name?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          baby_name?: string;
          created_at?: string;
          cycle_length?: number;
          doctor?: string;
          edd_override?: string | null;
          id?: string;
          lmp?: string;
          mother_name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      records: {
        Row: {
          created_at: string;
          crl: string;
          date: string;
          fhr: string;
          id: string;
          new_edd: string | null;
          notes: string;
          provider: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          crl?: string;
          date: string;
          fhr?: string;
          id?: string;
          new_edd?: string | null;
          notes?: string;
          provider?: string;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          crl?: string;
          date?: string;
          fhr?: string;
          id?: string;
          new_edd?: string | null;
          notes?: string;
          provider?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          author: string;
          created_at: string;
          duration: string;
          id: string;
          license: string;
          pub_date: string;
          source: string;
          title: string;
          url: string;
          user_id: string;
          week: number;
        };
        Insert: {
          author?: string;
          created_at?: string;
          duration?: string;
          id?: string;
          license?: string;
          pub_date?: string;
          source?: string;
          title: string;
          url: string;
          user_id: string;
          week: number;
        };
        Update: {
          author?: string;
          created_at?: string;
          duration?: string;
          id?: string;
          license?: string;
          pub_date?: string;
          source?: string;
          title?: string;
          url?: string;
          user_id?: string;
          week?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
