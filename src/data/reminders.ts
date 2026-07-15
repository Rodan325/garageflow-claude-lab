import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { maintenanceRemindersEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import type { MaintenanceReminder, ReminderType } from '@/features/reminders/model'
import type { Lang } from '@/i18n'

export function useMaintenanceReminders(garageId?: string, clientId?: string) {
  return useQuery({
    queryKey: ['maintenance-reminders', garageId, clientId],
    enabled: (!!garageId || !!clientId) && maintenanceRemindersEnabled(),
    queryFn: async (): Promise<MaintenanceReminder[]> => {
      if (isDemo()) return demo.maintenanceReminders(garageId, clientId)
      let query = supabase.from('maintenance_reminders').select('*').order('scheduled_at')
      if (garageId) query = query.eq('garage_id', garageId)
      if (clientId) query = query.eq('client_id', clientId)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as MaintenanceReminder[]
    },
  })
}

export function useCreateMaintenanceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      garageId: string
      centerId?: string | null
      clientId: string
      vehicleId?: string | null
      clientVehicleId?: string | null
      serviceRequestId?: string | null
      reminderType: ReminderType
      title: string
      dueDate?: string | null
      dueMileage?: number | null
      scheduledAt?: string
      source?: string
      language?: Lang
    }) => {
      if (!maintenanceRemindersEnabled()) throw new Error('Maintenance reminders are disabled')
      if (isDemo()) return demo.createMaintenanceReminder(input)
      const { data, error } = await supabase.rpc('create_maintenance_reminder', {
        p_garage_id: input.garageId,
        p_center_id: input.centerId ?? null,
        p_client_id: input.clientId,
        p_vehicle_id: input.vehicleId ?? null,
        p_client_vehicle_id: input.clientVehicleId ?? null,
        p_service_request_id: input.serviceRequestId ?? null,
        p_reminder_type: input.reminderType,
        p_title: input.title,
        p_due_date: input.dueDate ?? null,
        p_due_mileage: input.dueMileage ?? null,
        p_scheduled_at: input.scheduledAt,
        p_source: input.source,
        p_language: input.language ?? 'fr',
      })
      if (error) throw error
      return data as unknown as MaintenanceReminder
    },
    onSuccess: (reminder) => queryClient.invalidateQueries({ queryKey: ['maintenance-reminders', reminder.garage_id] }),
  })
}

export function useConvertMaintenanceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { reminderId: string; requestId?: string }) => {
      if (!maintenanceRemindersEnabled()) throw new Error('Maintenance reminders are disabled')
      if (isDemo()) return demo.convertMaintenanceReminder(input.reminderId)
      if (!input.requestId) throw new Error('An existing request is required outside demo mode')
      const { data, error } = await supabase.rpc('mark_maintenance_reminder_converted', {
        p_reminder_id: input.reminderId,
        p_request_id: input.requestId,
      })
      if (error) throw error
      return { reminder: data as unknown as MaintenanceReminder, request: null }
    },
    onSuccess: ({ reminder }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-reminders', reminder.garage_id] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
