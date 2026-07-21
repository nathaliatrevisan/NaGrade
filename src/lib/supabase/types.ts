/**
 * Tipos do banco de dados.
 * Formato compatível com o client tipado do Supabase.
 * No futuro pode ser gerado com `supabase gen types typescript`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          artist: string
          venue: string
          city: string
          state: string | null
          country: string
          event_date: string
          festival: boolean
          setlistfm_id: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          artist: string
          venue: string
          city: string
          state?: string | null
          country?: string
          event_date: string
          festival?: boolean
          setlistfm_id?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          artist?: string
          venue?: string
          city?: string
          state?: string | null
          country?: string
          event_date?: string
          festival?: boolean
          setlistfm_id?: string | null
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          event_id: string
          rating: number | null
          ticket_price: number | null
          ticket_type: string | null
          genre: string | null
          notes: string | null
          festival: boolean
          festival_name: string | null
          user_festival_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          rating?: number | null
          ticket_price?: number | null
          ticket_type?: string | null
          genre?: string | null
          notes?: string | null
          festival?: boolean
          festival_name?: string | null
          user_festival_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          rating?: number | null
          ticket_price?: number | null
          ticket_type?: string | null
          genre?: string | null
          notes?: string | null
          festival?: boolean
          festival_name?: string | null
          user_festival_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_events_event_id_fkey'
            columns: ['event_id']
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_events_user_festival_id_fkey'
            columns: ['user_festival_id']
            referencedRelation: 'user_festivals'
            referencedColumns: ['id']
          }
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      festivals: {
        Row: {
          id: string
          name: string
          city: string | null
          country: string
          start_date: string | null
          end_date: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          country?: string
          start_date?: string | null
          end_date?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          country?: string
          start_date?: string | null
          end_date?: string | null
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      user_festivals: {
        Row: {
          id: string
          user_id: string
          festival_id: string
          name: string | null
          ticket_price: number | null
          ticket_type: string | null
          festival_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          festival_id: string
          name?: string | null
          ticket_price?: number | null
          ticket_type?: string | null
          festival_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          festival_id?: string
          name?: string | null
          ticket_price?: number | null
          ticket_type?: string | null
          festival_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_festivals_festival_id_fkey'
            columns: ['festival_id']
            referencedRelation: 'festivals'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
