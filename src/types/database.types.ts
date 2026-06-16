export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          ends_at: string | null
          garage_id: string
          id: string
          notes: string | null
          service_request_id: string | null
          starts_at: string
          status: string
          title: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          ends_at?: string | null
          garage_id: string
          id?: string
          notes?: string | null
          service_request_id?: string | null
          starts_at: string
          status?: string
          title: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          ends_at?: string | null
          garage_id?: string
          id?: string
          notes?: string | null
          service_request_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          garage_id: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          garage_id?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          garage_id?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          created_at: string
          default_garage_id: string | null
          id: string
          marketing_consent: boolean
        }
        Insert: {
          created_at?: string
          default_garage_id?: string | null
          id: string
          marketing_consent?: boolean
        }
        Update: {
          created_at?: string
          default_garage_id?: string | null
          id?: string
          marketing_consent?: boolean
        }
        Relationships: []
      }
      client_vehicles: {
        Row: {
          brand: string
          client_id: string
          created_at: string
          fuel: string | null
          id: string
          mileage: number | null
          model: string
          registration: string | null
          year: number | null
        }
        Insert: {
          brand: string
          client_id: string
          created_at?: string
          fuel?: string | null
          id?: string
          mileage?: number | null
          model: string
          registration?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          client_id?: string
          created_at?: string
          fuel?: string | null
          id?: string
          mileage?: number | null
          model?: string
          registration?: string | null
          year?: number | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_key: string
          created_at: string
          garage_id: string | null
          granted: boolean
          granted_at: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          consent_key: string
          created_at?: string
          garage_id?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          source?: string
          user_id: string
        }
        Update: {
          consent_key?: string
          created_at?: string
          garage_id?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string | null
          garage_id: string
          id: string
          last_name: string | null
          linked_user_id: string | null
          marketing_consent: boolean
          notes: string | null
          phone: string | null
          postal_code: string | null
          source: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          garage_id: string
          id?: string
          last_name?: string | null
          linked_user_id?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          garage_id?: string
          id?: string
          last_name?: string | null
          linked_user_id?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          customer_id: string | null
          doc_type: string | null
          garage_id: string
          id: string
          status: string
          storage_key: string | null
          title: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          doc_type?: string | null
          garage_id: string
          id?: string
          status?: string
          storage_key?: string | null
          title: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          doc_type?: string | null
          garage_id?: string
          id?: string
          status?: string
          storage_key?: string | null
          title?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      garage_hours: {
        Row: {
          close_time: string | null
          garage_id: string
          id: string
          is_closed: boolean
          open_time: string | null
          weekday: number
        }
        Insert: {
          close_time?: string | null
          garage_id: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          weekday: number
        }
        Update: {
          close_time?: string | null
          garage_id?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          weekday?: number
        }
        Relationships: []
      }
      garage_members: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          invited_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          invited_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          invited_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      garage_news: {
        Row: {
          body: string | null
          created_at: string
          garage_id: string
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          garage_id: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          garage_id?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      garage_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          garage_id: string
          id: string
          is_active: boolean
          name: string
          price_from: number | null
          sort_order: number
          tax_rate: number
          labor_hours: number | null
          price_type: string
          default_lines: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          garage_id: string
          id?: string
          is_active?: boolean
          name: string
          price_from?: number | null
          sort_order?: number
          tax_rate?: number
          labor_hours?: number | null
          price_type?: string
          default_lines?: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          garage_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_from?: number | null
          sort_order?: number
          tax_rate?: number
          labor_hours?: number | null
          price_type?: string
          default_lines?: Json
        }
        Relationships: []
      }
      garages: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_public: boolean
          legal_name: string | null
          logo_url: string | null
          accent_color: string | null
          legal_info: string | null
          maps_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          settings: Json
          siret: string | null
          slug: string
          specialties: string[]
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          legal_name?: string | null
          logo_url?: string | null
          accent_color?: string | null
          legal_info?: string | null
          maps_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json
          siret?: string | null
          slug: string
          specialties?: string[]
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          legal_name?: string | null
          logo_url?: string | null
          accent_color?: string | null
          legal_info?: string | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json
          siret?: string | null
          slug?: string
          specialties?: string[]
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      quote_lines: {
        Row: {
          id: string
          label: string
          line_total: number
          quantity: number
          quote_id: string
          sort_order: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          id?: string
          label: string
          line_total?: number
          quantity?: number
          quote_id: string
          sort_order?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          id?: string
          label?: string
          line_total?: number
          quantity?: number
          quote_id?: string
          sort_order?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_total: number
          client_name: string | null
          vehicle_label: string | null
          conditions: string | null
          valid_until: string | null
          service_request_id: string | null
          client_phone: string | null
          client_email: string | null
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          status: string
          subtotal: number
          tax_total: number
          title: string
          total: number
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          client_name?: string | null
          vehicle_label?: string | null
          conditions?: string | null
          valid_until?: string | null
          service_request_id?: string | null
          client_phone?: string | null
          client_email?: string | null
          garage_id: string
          id?: string
          notes?: string | null
          number: string
          repair_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          title: string
          total?: number
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          client_name?: string | null
          vehicle_label?: string | null
          conditions?: string | null
          valid_until?: string | null
          service_request_id?: string | null
          client_phone?: string | null
          client_email?: string | null
          garage_id?: string
          id?: string
          notes?: string | null
          number?: string
          repair_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          title?: string
          total?: number
          vehicle_id?: string | null
        }
        Relationships: []
      }
      repairs: {
        Row: {
          appointment_id: string | null
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          diagnostic: string | null
          garage_id: string
          id: string
          notes: string | null
          status: string
          symptom: string | null
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          diagnostic?: string | null
          garage_id: string
          id?: string
          notes?: string | null
          status?: string
          symptom?: string | null
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          diagnostic?: string | null
          garage_id?: string
          id?: string
          notes?: string | null
          status?: string
          symptom?: string | null
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      service_request_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          garage_id: string
          id: string
          request_id: string
          sender: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          garage_id: string
          id?: string
          request_id: string
          sender: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          garage_id?: string
          id?: string
          request_id?: string
          sender?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          appointment_id: string | null
          client_id: string
          client_vehicle_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          garage_id: string
          id: string
          note: string | null
          proposed_date: string | null
          proposed_time: string | null
          reference: string
          requested_date: string | null
          requested_time: string | null
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
          vehicle_label: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          client_vehicle_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          garage_id: string
          id?: string
          note?: string | null
          proposed_date?: string | null
          proposed_time?: string | null
          reference?: string
          requested_date?: string | null
          requested_time?: string | null
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
          vehicle_label?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          client_vehicle_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          garage_id?: string
          id?: string
          note?: string | null
          proposed_date?: string | null
          proposed_time?: string | null
          reference?: string
          requested_date?: string | null
          requested_time?: string | null
          service_id?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          vehicle_label?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          garage_id: string
          id: string
          priority: string
          related_vehicle_id: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          garage_id: string
          id?: string
          priority?: string
          related_vehicle_id?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          garage_id?: string
          id?: string
          priority?: string
          related_vehicle_id?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          customer_id: string | null
          fuel: string | null
          garage_id: string
          gearbox: string | null
          id: string
          mileage: number | null
          model: string
          notes: string | null
          registration: string | null
          status: string
          updated_at: string
          version: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          customer_id?: string | null
          fuel?: string | null
          garage_id: string
          gearbox?: string | null
          id?: string
          mileage?: number | null
          model: string
          notes?: string | null
          registration?: string | null
          status?: string
          updated_at?: string
          version?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          customer_id?: string | null
          fuel?: string | null
          garage_id?: string
          gearbox?: string | null
          id?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          registration?: string | null
          status?: string
          updated_at?: string
          version?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      has_garage_role: {
        Args: { p_garage_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_garage_member: { Args: { p_garage_id: string }; Returns: boolean }
      next_quote_number: { Args: { p_garage_id: string }; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
