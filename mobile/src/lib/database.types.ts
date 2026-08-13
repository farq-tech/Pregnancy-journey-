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
          recurrence: string | null;
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
          recurrence?: string | null;
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
          recurrence?: string | null;
          reminder?: string;
          time?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          caption: string;
          created_at: string;
          id: string;
          kind: string;
          mime_type: string;
          owner_id: string;
          owner_type: string;
          path: string;
          size_bytes: number | null;
          user_id: string;
        };
        Insert: {
          caption?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          mime_type?: string;
          owner_id: string;
          owner_type: string;
          path: string;
          size_bytes?: number | null;
          user_id: string;
        };
        Update: {
          caption?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          mime_type?: string;
          owner_id?: string;
          owner_type?: string;
          path?: string;
          size_bytes?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      test_tracking: {
        Row: {
          appointment_id: string | null;
          id: string;
          notes: string;
          status: string;
          test_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_id?: string | null;
          id?: string;
          notes?: string;
          status?: string;
          test_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          appointment_id?: string | null;
          id?: string;
          notes?: string;
          status?: string;
          test_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'test_tracking_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
        ];
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
          scan_ga_days: number | null;
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
          scan_ga_days?: number | null;
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
          scan_ga_days?: number | null;
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
          description: string;
          duration: string;
          id: string;
          license: string;
          pub_date: string;
          source: string;
          thumbnail_url: string;
          title: string;
          url: string;
          user_id: string;
          week: number;
        };
        Insert: {
          author?: string;
          created_at?: string;
          description?: string;
          duration?: string;
          id?: string;
          license?: string;
          pub_date?: string;
          source?: string;
          thumbnail_url?: string;
          title: string;
          url: string;
          user_id: string;
          week: number;
        };
        Update: {
          author?: string;
          created_at?: string;
          description?: string;
          duration?: string;
          id?: string;
          license?: string;
          pub_date?: string;
          source?: string;
          thumbnail_url?: string;
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
