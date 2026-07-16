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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          assigned_to: string | null
          center_id: string | null
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
          center_id?: string | null
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
          center_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "client_profiles_default_garage_id_fkey"
            columns: ["default_garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_vehicle_shares: {
        Row: {
          client_vehicle_id: string
          created_at: string
          garage_id: string
          id: string
          revoked_at: string | null
          scope: string
          service_request_id: string | null
          shared_at: string
          shared_by: string
        }
        Insert: {
          client_vehicle_id: string
          created_at?: string
          garage_id: string
          id?: string
          revoked_at?: string | null
          scope?: string
          service_request_id?: string | null
          shared_at?: string
          shared_by: string
        }
        Update: {
          client_vehicle_id?: string
          created_at?: string
          garage_id?: string
          id?: string
          revoked_at?: string | null
          scope?: string
          service_request_id?: string | null
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_vehicle_shares_client_vehicle_id_fkey"
            columns: ["client_vehicle_id"]
            isOneToOne: false
            referencedRelation: "client_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_vehicle_shares_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_vehicle_shares_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      client_vehicles: {
        Row: {
          archived: boolean
          brand: string
          client_id: string
          created_at: string
          fuel: string | null
          id: string
          mileage: number | null
          model: string
          notes: string | null
          registration: string | null
          year: number | null
        }
        Insert: {
          archived?: boolean
          brand: string
          client_id: string
          created_at?: string
          fuel?: string | null
          id?: string
          mileage?: number | null
          model: string
          notes?: string | null
          registration?: string | null
          year?: number | null
        }
        Update: {
          archived?: boolean
          brand?: string
          client_id?: string
          created_at?: string
          fuel?: string | null
          id?: string
          mileage?: number | null
          model?: string
          notes?: string | null
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
        Relationships: [
          {
            foreignKeyName: "consents_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "customers_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_centers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          garage_id: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          postal_code: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          garage_id: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          postal_code?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          garage_id?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          postal_code?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "garage_centers_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "garage_hours_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_members: {
        Row: {
          center_id: string | null
          created_at: string
          garage_id: string
          id: string
          invited_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          garage_id: string
          id?: string
          invited_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          garage_id?: string
          id?: string
          invited_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_members_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "garage_news_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_services: {
        Row: {
          category: string | null
          created_at: string
          default_lines: Json
          description: string | null
          duration_minutes: number
          garage_id: string
          id: string
          is_active: boolean
          labor_hours: number | null
          name: string
          price_from: number | null
          price_type: string
          sort_order: number
          tax_rate: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_lines?: Json
          description?: string | null
          duration_minutes?: number
          garage_id: string
          id?: string
          is_active?: boolean
          labor_hours?: number | null
          name: string
          price_from?: number | null
          price_type?: string
          sort_order?: number
          tax_rate?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          default_lines?: Json
          description?: string | null
          duration_minutes?: number
          garage_id?: string
          id?: string
          is_active?: boolean
          labor_hours?: number | null
          name?: string
          price_from?: number | null
          price_type?: string
          sort_order?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "garage_services_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garages: {
        Row: {
          accent_color: string | null
          address: string | null
          city: string | null
          country: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_public: boolean
          legal_info: string | null
          legal_name: string | null
          logo_url: string | null
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
          accent_color?: string | null
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          legal_info?: string | null
          legal_name?: string | null
          logo_url?: string | null
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
          accent_color?: string | null
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          legal_info?: string | null
          legal_name?: string | null
          logo_url?: string | null
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
      legal_acceptances: {
        Row: {
          acceptance_context: string
          accepted_at: string
          created_at: string
          document_type: string
          document_version: string
          id: string
          role: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acceptance_context?: string
          accepted_at?: string
          created_at?: string
          document_type: string
          document_version: string
          id?: string
          role: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acceptance_context?: string
          accepted_at?: string
          created_at?: string
          document_type?: string
          document_version?: string
          id?: string
          role?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_reports: {
        Row: {
          accepted_recommendations: Json
          authorized_attachment_ids: string[]
          center_id: string | null
          checked_in_at: string | null
          completed_work: Json
          created_at: string
          customer_snapshot: Json
          deferred_recommendations: Json
          delivered_at: string | null
          diagnostic_summary: string | null
          entry_mileage: number | null
          exit_mileage: number | null
          final_validation: string | null
          finalized_at: string | null
          finalized_by: string | null
          garage_id: string
          id: string
          next_due_date: string | null
          next_due_mileage: number | null
          observations: string | null
          parts: Json
          report_number: string
          requested_work: Json
          service_request_id: string
          status: string
          updated_at: string
          vehicle_snapshot: Json
          warranty_terms: string | null
        }
        Insert: {
          accepted_recommendations?: Json
          authorized_attachment_ids?: string[]
          center_id?: string | null
          checked_in_at?: string | null
          completed_work?: Json
          created_at?: string
          customer_snapshot?: Json
          deferred_recommendations?: Json
          delivered_at?: string | null
          diagnostic_summary?: string | null
          entry_mileage?: number | null
          exit_mileage?: number | null
          final_validation?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          garage_id: string
          id?: string
          next_due_date?: string | null
          next_due_mileage?: number | null
          observations?: string | null
          parts?: Json
          report_number: string
          requested_work?: Json
          service_request_id: string
          status?: string
          updated_at?: string
          vehicle_snapshot?: Json
          warranty_terms?: string | null
        }
        Update: {
          accepted_recommendations?: Json
          authorized_attachment_ids?: string[]
          center_id?: string | null
          checked_in_at?: string | null
          completed_work?: Json
          customer_snapshot?: Json
          deferred_recommendations?: Json
          delivered_at?: string | null
          diagnostic_summary?: string | null
          entry_mileage?: number | null
          exit_mileage?: number | null
          final_validation?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          next_due_date?: string | null
          next_due_mileage?: number | null
          observations?: string | null
          parts?: Json
          requested_work?: Json
          status?: string
          updated_at?: string
          vehicle_snapshot?: Json
          warranty_terms?: string | null
        }
        Relationships: []
      }
      maintenance_reminders: {
        Row: {
          center_id: string | null
          client_id: string
          client_vehicle_id: string | null
          converted_request_id: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          due_mileage: number | null
          garage_id: string
          id: string
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          service_request_id: string | null
          source: string
          status: string
          title: string
          vehicle_id: string | null
        }
        Insert: {
          center_id?: string | null
          client_id: string
          client_vehicle_id?: string | null
          converted_request_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          due_mileage?: number | null
          garage_id: string
          id?: string
          reminder_type: string
          scheduled_at?: string
          sent_at?: string | null
          service_request_id?: string | null
          source?: string
          status?: string
          title: string
          vehicle_id?: string | null
        }
        Update: {
          center_id?: string | null
          client_id?: string
          client_vehicle_id?: string | null
          converted_request_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          due_mileage?: number | null
          garage_id?: string
          id?: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          service_request_id?: string | null
          source?: string
          status?: string
          title?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          attempts: number
          center_id: string | null
          channel: string
          created_at: string
          error_code: string | null
          failed_at: string | null
          garage_id: string
          id: string
          language: string
          payload: Json
          provider: string | null
          provider_message_id: string | null
          recipient_address: string | null
          recipient_user_id: string | null
          scheduled_at: string
          sent_at: string | null
          service_request_id: string | null
          status: string
          template_key: string
        }
        Insert: {
          attempts?: number
          center_id?: string | null
          channel: string
          created_at?: string
          error_code?: string | null
          failed_at?: string | null
          garage_id: string
          id?: string
          language?: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient_address?: string | null
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          service_request_id?: string | null
          status?: string
          template_key: string
        }
        Update: {
          attempts?: number
          center_id?: string | null
          channel?: string
          created_at?: string
          error_code?: string | null
          failed_at?: string | null
          garage_id?: string
          id?: string
          language?: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient_address?: string | null
          recipient_user_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          service_request_id?: string | null
          status?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_center_garage_fk"
            columns: ["center_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "garage_centers"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "notification_outbox_center_garage_fk"
            columns: ["center_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "garage_centers"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "notification_outbox_request_garage_fk"
            columns: ["service_request_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id", "garage_id"]
          },
        ]
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
      quote_counters: {
        Row: {
          garage_id: string
          last_number: number
          year: number
        }
        Insert: {
          garage_id: string
          last_number?: number
          year: number
        }
        Update: {
          garage_id?: string
          last_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_counters_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_decisions: {
        Row: {
          action: string
          decided_by: string | null
          displayed_language: string | null
          garage_id: string
          id: string
          legal_privacy_version: string | null
          legal_terms_version: string | null
          new_status: string
          note: string | null
          occurred_at: string
          previous_status: string
          recommendation_id: string
          service_request_id: string
          visible_to_customer: boolean
        }
        Insert: {
          action: string
          decided_by?: string | null
          displayed_language?: string | null
          garage_id: string
          id?: string
          legal_privacy_version?: string | null
          legal_terms_version?: string | null
          new_status: string
          note?: string | null
          occurred_at?: string
          previous_status: string
          recommendation_id: string
          service_request_id: string
          visible_to_customer?: boolean
        }
        Update: {
          action?: string
          decided_by?: string | null
          displayed_language?: string | null
          garage_id?: string
          id?: string
          legal_privacy_version?: string | null
          legal_terms_version?: string | null
          new_status?: string
          note?: string | null
          occurred_at?: string
          previous_status?: string
          recommendation_id?: string
          service_request_id?: string
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_decisions_recommendation_garage_fk"
            columns: ["recommendation_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "workshop_recommendations"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "recommendation_decisions_request_garage_fk"
            columns: ["service_request_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id", "garage_id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_privacy_version: string | null
          accepted_terms_version: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_token: string | null
          conditions: string | null
          created_at: string
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          discount_total: number
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          recommendation_id: string | null
          revised_from: string | null
          sent_at: string | null
          service_request_id: string | null
          status: string
          subtotal: number
          supplemental_to_quote_id: string | null
          tax_total: number
          title: string
          total: number
          valid_until: string | null
          vehicle_id: string | null
          vehicle_label: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_privacy_version?: string | null
          accepted_terms_version?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_token?: string | null
          conditions?: string | null
          created_at?: string
          customer_id?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          discount_total?: number
          garage_id: string
          id?: string
          notes?: string | null
          number: string
          repair_id?: string | null
          recommendation_id?: string | null
          revised_from?: string | null
          sent_at?: string | null
          service_request_id?: string | null
          status?: string
          subtotal?: number
          supplemental_to_quote_id?: string | null
          tax_total?: number
          title: string
          total?: number
          valid_until?: string | null
          vehicle_id?: string | null
          vehicle_label?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_privacy_version?: string | null
          accepted_terms_version?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_token?: string | null
          conditions?: string | null
          created_at?: string
          customer_id?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          discount_total?: number
          garage_id?: string
          id?: string
          notes?: string | null
          number?: string
          repair_id?: string | null
          recommendation_id?: string | null
          revised_from?: string | null
          sent_at?: string | null
          service_request_id?: string | null
          status?: string
          subtotal?: number
          supplemental_to_quote_id?: string | null
          tax_total?: number
          title?: string
          total?: number
          valid_until?: string | null
          vehicle_id?: string | null
          vehicle_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_recommendation_garage_fk"
            columns: ["recommendation_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "workshop_recommendations"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "quotes_revised_from_fkey"
            columns: ["revised_from"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplemental_to_garage_fk"
            columns: ["supplemental_to_quote_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "repairs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_attachments: {
        Row: {
          center_id: string | null
          created_at: string
          document_type: string
          file_name: string
          file_size: number
          garage_id: string
          id: string
          mime_type: string
          recommendation_id: string | null
          service_request_id: string
          storage_path: string
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          document_type?: string
          file_name: string
          file_size: number
          garage_id: string
          id?: string
          mime_type: string
          recommendation_id?: string | null
          service_request_id: string
          storage_path: string
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number
          garage_id?: string
          id?: string
          mime_type?: string
          recommendation_id?: string | null
          service_request_id?: string
          storage_path?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_attachments_center_garage_fk"
            columns: ["center_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "garage_centers"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "service_request_attachments_recommendation_garage_fk"
            columns: ["recommendation_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "workshop_recommendations"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "service_request_attachments_request_garage_fk"
            columns: ["service_request_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id", "garage_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "service_request_messages_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_transfer_events: {
        Row: {
          changed_by: string
          garage_id: string
          id: string
          new_status: string
          note: string | null
          occurred_at: string
          previous_status: string | null
          transfer_id: string
        }
        Insert: {
          changed_by: string
          garage_id: string
          id?: string
          new_status: string
          note?: string | null
          occurred_at?: string
          previous_status?: string | null
          transfer_id: string
        }
        Update: {
          changed_by?: string
          garage_id?: string
          id?: string
          new_status?: string
          note?: string | null
          occurred_at?: string
          previous_status?: string | null
          transfer_id?: string
        }
        Relationships: []
      }
      service_request_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_confirmed_at: string | null
          from_center_id: string
          garage_id: string
          id: string
          reason: string | null
          requested_by: string
          service_request_id: string
          status: string
          to_center_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          from_center_id: string
          garage_id: string
          id?: string
          reason?: string | null
          requested_by: string
          service_request_id: string
          status?: string
          to_center_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          from_center_id?: string
          garage_id?: string
          id?: string
          reason?: string | null
          requested_by?: string
          service_request_id?: string
          status?: string
          to_center_id?: string
        }
        Relationships: []
      }
      service_request_timeline: {
        Row: {
          center_id: string | null
          changed_by: string | null
          customer_message: string | null
          estimated_completion_at: string | null
          garage_id: string
          id: string
          internal_note: string | null
          new_stage: string
          notification_status: string
          occurred_at: string
          previous_stage: string | null
          request_id: string
          visible_to_customer: boolean
        }
        Insert: {
          center_id?: string | null
          changed_by?: string | null
          customer_message?: string | null
          estimated_completion_at?: string | null
          garage_id: string
          id?: string
          internal_note?: string | null
          new_stage: string
          notification_status?: string
          occurred_at?: string
          previous_stage?: string | null
          request_id: string
          visible_to_customer?: boolean
        }
        Update: {
          center_id?: string | null
          changed_by?: string | null
          customer_message?: string | null
          estimated_completion_at?: string | null
          garage_id?: string
          id?: string
          internal_note?: string | null
          new_stage?: string
          notification_status?: string
          occurred_at?: string
          previous_stage?: string | null
          request_id?: string
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_request_timeline_center_garage_fk"
            columns: ["center_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "garage_centers"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "service_request_timeline_request_garage_fk"
            columns: ["request_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id", "garage_id"]
          },
        ]
      }
      service_requests: {
        Row: {
          appointment_id: string | null
          center_id: string | null
          client_id: string
          client_stage: string | null
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
          estimated_completion_at: string | null
          vehicle_checked_in_at: string | null
          vehicle_delivered_at: string | null
          vehicle_label: string | null
          workshop_stage: string | null
        }
        Insert: {
          appointment_id?: string | null
          center_id?: string | null
          client_id: string
          client_stage?: string | null
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
          estimated_completion_at?: string | null
          vehicle_checked_in_at?: string | null
          vehicle_delivered_at?: string | null
          vehicle_label?: string | null
          workshop_stage?: string | null
        }
        Update: {
          appointment_id?: string | null
          center_id?: string | null
          client_id?: string
          client_stage?: string | null
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
          estimated_completion_at?: string | null
          vehicle_checked_in_at?: string | null
          vehicle_delivered_at?: string | null
          vehicle_label?: string | null
          workshop_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_appointment_fk"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_vehicle_id_fkey"
            columns: ["client_vehicle_id"]
            isOneToOne: false
            referencedRelation: "client_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "garage_services"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_recommendations: {
        Row: {
          affects_delivery_time: boolean
          category: string | null
          center_id: string | null
          created_at: string
          created_by: string | null
          customer_decision_note: string | null
          decided_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          estimated_price: number | null
          garage_id: string
          id: string
          proposed_delivery_at: string | null
          reason: string | null
          service_request_id: string
          status: string
          title: string
          urgency: string
        }
        Insert: {
          affects_delivery_time?: boolean
          category?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_decision_note?: string | null
          decided_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          estimated_price?: number | null
          garage_id: string
          id?: string
          proposed_delivery_at?: string | null
          reason?: string | null
          service_request_id: string
          status?: string
          title: string
          urgency?: string
        }
        Update: {
          affects_delivery_time?: boolean
          category?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_decision_note?: string | null
          decided_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          estimated_price?: number | null
          garage_id?: string
          id?: string
          proposed_delivery_at?: string | null
          reason?: string | null
          service_request_id?: string
          status?: string
          title?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_recommendations_center_garage_fk"
            columns: ["center_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "garage_centers"
            referencedColumns: ["id", "garage_id"]
          },
          {
            foreignKeyName: "workshop_recommendations_request_garage_fk"
            columns: ["service_request_id", "garage_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id", "garage_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_vehicle_id_fkey"
            columns: ["related_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote_public: {
        Args: { p_token: string; p_terms_version?: string; p_privacy_version?: string }
        Returns: Json
      }
      create_workshop_recommendation: {
        Args: {
          p_request_id: string
          p_title: string
          p_description?: string | null
          p_category?: string | null
          p_urgency?: string
          p_reason?: string | null
          p_estimated_price?: number | null
          p_estimated_duration_minutes?: number | null
          p_affects_delivery_time?: boolean
          p_proposed_delivery_at?: string | null
        }
        Returns: Database["public"]["Tables"]["workshop_recommendations"]["Row"]
      }
      create_maintenance_reminder: {
        Args: {
          p_garage_id: string
          p_center_id: string | null
          p_client_id: string
          p_vehicle_id: string | null
          p_client_vehicle_id: string | null
          p_service_request_id: string | null
          p_reminder_type: string
          p_title: string
          p_due_date: string | null
          p_due_mileage: number | null
          p_scheduled_at?: string
          p_source?: string
          p_language?: string
        }
        Returns: Database["public"]["Tables"]["maintenance_reminders"]["Row"]
      }
      complete_center_transfer: {
        Args: { p_transfer_id: string }
        Returns: Database["public"]["Tables"]["service_request_transfers"]["Row"]
      }
      decide_center_transfer: {
        Args: { p_transfer_id: string; p_accept: boolean; p_note?: string | null }
        Returns: Database["public"]["Tables"]["service_request_transfers"]["Row"]
      }
      get_network_dashboard: {
        Args: { p_garage_id: string; p_start?: string | null; p_end?: string | null }
        Returns: {
          center_id: string
          center_name: string
          appointments: number
          interventions: number
          quote_amount: number
          accepted_amount: number
          acceptance_rate: number | null
          average_decision_hours: number | null
          average_intervention_hours: number | null
          vehicles_waiting: number
          delays: number
          reminders_converted: number
          satisfaction: number | null
        }[]
      }
      decide_workshop_recommendation: {
        Args: {
          p_recommendation_id: string
          p_action: string
          p_note?: string | null
          p_terms_version?: string | null
          p_privacy_version?: string | null
          p_displayed_language?: string | null
        }
        Returns: Database["public"]["Tables"]["workshop_recommendations"]["Row"]
      }
      create_quote_with_lines: {
        Args: { p_lines: Json; p_quote: Json }
        Returns: {
          accepted_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_token: string | null
          conditions: string | null
          created_at: string
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          discount_total: number
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          revised_from: string | null
          sent_at: string | null
          service_request_id: string | null
          status: string
          subtotal: number
          tax_total: number
          title: string
          total: number
          valid_until: string | null
          vehicle_id: string | null
          vehicle_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decline_quote_public: {
        Args: { p_reason?: string; p_token: string }
        Returns: Json
      }
      expire_quotes: { Args: never; Returns: number }
      get_quote_public: { Args: { p_token: string }; Returns: Json }
      get_workshop_timeline: {
        Args: { p_request_id: string }
        Returns: Database["public"]["Tables"]["service_request_timeline"]["Row"][]
      }
      has_garage_role: {
        Args: { p_garage_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_garage_member: { Args: { p_garage_id: string }; Returns: boolean }
      link_recommendation_quote: {
        Args: {
          p_recommendation_id: string
          p_quote_id: string
          p_supplemental_to_quote_id?: string | null
        }
        Returns: Database["public"]["Tables"]["quotes"]["Row"]
      }
      mark_maintenance_reminder_converted: {
        Args: { p_reminder_id: string; p_request_id: string }
        Returns: Database["public"]["Tables"]["maintenance_reminders"]["Row"]
      }
      next_quote_number: { Args: { p_garage_id: string }; Returns: string }
      propose_center_transfer: {
        Args: { p_request_id: string; p_to_center_id: string; p_reason?: string | null }
        Returns: Database["public"]["Tables"]["service_request_transfers"]["Row"]
      }
      transition_workshop_stage: {
        Args: {
          p_request_id: string
          p_new_stage: string
          p_internal_note?: string | null
          p_customer_message?: string | null
          p_estimated_completion_at?: string | null
          p_visible_to_customer?: boolean
        }
        Returns: Database["public"]["Tables"]["service_request_timeline"]["Row"]
      }
      revise_quote: {
        Args: { p_id: string }
        Returns: {
          accepted_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_token: string | null
          conditions: string | null
          created_at: string
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          discount_total: number
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          revised_from: string | null
          sent_at: string | null
          service_request_id: string | null
          status: string
          subtotal: number
          tax_total: number
          title: string
          total: number
          valid_until: string | null
          vehicle_id: string | null
          vehicle_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_service_request_attachment: {
        Args: {
          p_request_id: string
          p_recommendation_id: string | null
          p_file_name: string
          p_mime_type: string
          p_file_size: number
          p_storage_path: string
          p_visibility?: string
          p_document_type?: string
        }
        Returns: Database["public"]["Tables"]["service_request_attachments"]["Row"]
      }
      save_delivery_report: {
        Args: { p_request_id: string; p_report: Json; p_finalize?: boolean }
        Returns: Database["public"]["Tables"]["delivery_reports"]["Row"]
      }
      set_workshop_recommendation_status: {
        Args: { p_recommendation_id: string; p_new_status: string; p_note?: string | null }
        Returns: Database["public"]["Tables"]["workshop_recommendations"]["Row"]
      }
      send_quote: {
        Args: { p_id: string }
        Returns: {
          accepted_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_token: string | null
          conditions: string | null
          created_at: string
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          discount_total: number
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          revised_from: string | null
          sent_at: string | null
          service_request_id: string | null
          status: string
          subtotal: number
          tax_total: number
          title: string
          total: number
          valid_until: string | null
          vehicle_id: string | null
          vehicle_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_quote_with_lines: {
        Args: { p_id: string; p_lines: Json; p_quote: Json }
        Returns: {
          accepted_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_token: string | null
          conditions: string | null
          created_at: string
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          discount_total: number
          garage_id: string
          id: string
          notes: string | null
          number: string
          repair_id: string | null
          revised_from: string | null
          sent_at: string | null
          service_request_id: string | null
          status: string
          subtotal: number
          tax_total: number
          title: string
          total: number
          valid_until: string | null
          vehicle_id: string | null
          vehicle_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      vehicle_shared_with_me: { Args: { p_vehicle: string }; Returns: boolean }
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
