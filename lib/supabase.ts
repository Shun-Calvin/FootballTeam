import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
/* const supabaseUrl = "https://phhrlvkbxagokuueoclx.supabase.co" */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
/* const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaHJsdmtieGFnb2t1dWVvY2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODY0MTcsImV4cCI6MjA2ODU2MjQxN30.qpPJkMa9TpTVdzHa2HrERxz7cuHiWefdIQrx_jzJkJQ" */

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string // Added email
          full_name: string
          jersey_number: number | null
          position: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string // Added email
          full_name: string
          jersey_number?: number | null
          position?: string | null
          phone?: string | null
        }
        Update: {
          username?: string
          email?: string // Added email
          full_name?: string
          jersey_number?: number | null
          position?: string | null
          phone?: string | null
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          opponent_team: string
          match_date: string
          location: string
          home_jersey_color: string | null
          away_jersey_color: string | null
          is_home_game: boolean | null
          video_link: string | null
          status: string | null
          final_score_home: number | null
          final_score_away: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          opponent_team: string
          match_date: string
          location: string
          home_jersey_color?: string | null
          away_jersey_color?: string | null
          is_home_game?: boolean | null
          video_link?: string | null
          status?: string | null
          final_score_home?: number | null
          final_score_away?: number | null
          created_by?: string | null
        }
        Update: {
          opponent_team?: string
          match_date?: string
          location?: string
          home_jersey_color?: string | null
          away_jersey_color?: string | null
          is_home_game?: boolean | null
          video_link?: string | null
          status?: string | null
          final_score_home?: number | null
          final_score_away?: number | null
          updated_at?: string
        }
      }
    }
  }
}
