export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ble_beacons: {
        Row: {
          id: string
          is_receiver: boolean
          label: string | null
          object_class: string | null
          registered_at: string
          room: string | null
        }
        Insert: {
          id: string
          is_receiver?: boolean
          label?: string | null
          object_class?: string | null
          registered_at?: string
          room?: string | null
        }
        Update: {
          id?: string
          is_receiver?: boolean
          label?: string | null
          object_class?: string | null
          registered_at?: string
          room?: string | null
        }
        Relationships: []
      }
      ble_rssi_log: {
        Row: {
          id: number
          receiver_id: string
          recorded_at: string
          rssi: number
          tag_id: string
        }
        Insert: {
          id?: never
          receiver_id: string
          recorded_at?: string
          rssi: number
          tag_id: string
        }
        Update: {
          id?: never
          receiver_id?: string
          recorded_at?: string
          rssi?: number
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ble_rssi_log_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "ble_beacons"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string
          patient_id: string | null
          phone: string | null
          relationship: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          patient_id?: string | null
          phone?: string | null
          relationship?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          patient_id?: string | null
          phone?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          id: string
          instructions: string | null
          name: string
          patient_id: string | null
          schedule_time: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          id?: string
          instructions?: string | null
          name: string
          patient_id?: string | null
          schedule_time?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          instructions?: string | null
          name?: string
          patient_id?: string | null
          schedule_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          category: string
          created_at: string
          description: string
          event_date: string | null
          id: string
          patient_id: string | null
          person_id: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          event_date?: string | null
          id?: string
          patient_id?: string | null
          person_id?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          event_date?: string | null
          id?: string
          patient_id?: string | null
          person_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      object_logs: {
        Row: {
          ble_tag_id: string | null
          confidence: number | null
          detected_at: string
          id: number
          label: string | null
          last_seen_location: string | null
          object_class: string
          source: string
        }
        Insert: {
          ble_tag_id?: string | null
          confidence?: number | null
          detected_at?: string
          id?: never
          label?: string | null
          last_seen_location?: string | null
          object_class: string
          source?: string
        }
        Update: {
          ble_tag_id?: string | null
          confidence?: number | null
          detected_at?: string
          id?: never
          label?: string | null
          last_seen_location?: string | null
          object_class?: string
          source?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          avatar_url: string | null
          caregiver_phone: string | null
          cognitive_score: number | null
          condition_stage: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          primary_caregiver: string | null
          risk_level: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          caregiver_phone?: string | null
          cognitive_score?: number | null
          condition_stage?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          primary_caregiver?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          caregiver_phone?: string | null
          cognitive_score?: number | null
          condition_stage?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          primary_caregiver?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          birthday: string | null
          created_at: string
          family_stories: string[]
          favorite_places: string[]
          favorite_songs: string[]
          hobbies: string[]
          id: string
          important_life_events: string[]
          memories: string[]
          name: string
          patient_id: string | null
          photo_urls: string[]
          relationship: string
          updated_at: string
          vector_status: string
          voice_notes: string[]
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          family_stories?: string[]
          favorite_places?: string[]
          favorite_songs?: string[]
          hobbies?: string[]
          id: string
          important_life_events?: string[]
          memories?: string[]
          name: string
          patient_id?: string | null
          photo_urls?: string[]
          relationship: string
          updated_at?: string
          vector_status?: string
          voice_notes?: string[]
        }
        Update: {
          birthday?: string | null
          created_at?: string
          family_stories?: string[]
          favorite_places?: string[]
          favorite_songs?: string[]
          hobbies?: string[]
          id?: string
          important_life_events?: string[]
          memories?: string[]
          name?: string
          patient_id?: string | null
          photo_urls?: string[]
          relationship?: string
          updated_at?: string
          vector_status?: string
          voice_notes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "people_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"],
  TableName extends DefaultSchemaTableNameOrOptions = DefaultSchemaTableNameOrOptions,
> = Database["public"]["Tables"][TableName] extends { Insert: infer I } ? I : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"],
  TableName extends DefaultSchemaTableNameOrOptions = DefaultSchemaTableNameOrOptions,
> = Database["public"]["Tables"][TableName] extends { Update: infer U } ? U : never
