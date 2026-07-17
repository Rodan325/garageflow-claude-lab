import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { supabase } from '@/lib/supabase'
import { workshopTimelineEnabled } from '@/lib/features'
import type { ServiceRequestTimelineEvent, WorkshopStage } from '@/types/domain'

export function useWorkshopTimeline(requestId?: string, customerView = false) {
  return useQuery({
    queryKey: ['workshop-timeline', requestId, customerView],
    enabled: !!requestId && workshopTimelineEnabled(),
    queryFn: async (): Promise<ServiceRequestTimelineEvent[]> => {
      if (isDemo()) {
        return demo.workshopTimeline(requestId!).filter((event) => {
          if (!customerView) return true
          event.internal_note = null
          return event.visible_to_customer
        })
      }
      const { data, error } = await supabase.rpc('get_workshop_timeline', { p_request_id: requestId! })
      if (error) throw error
      return data ?? []
    },
  })
}

export interface WorkshopTransitionInput {
  requestId: string
  garageId: string
  clientId: string
  newStage: WorkshopStage
  internalNote?: string | null
  customerMessage?: string | null
  estimatedCompletionAt?: string | null
  visibleToCustomer?: boolean
}

export function useTransitionWorkshopStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: WorkshopTransitionInput): Promise<ServiceRequestTimelineEvent> => {
      if (!workshopTimelineEnabled()) throw new Error('Workshop timeline is disabled')
      if (isDemo()) {
        return demo.transitionWorkshopStage({
          requestId: input.requestId,
          newStage: input.newStage,
          internalNote: input.internalNote,
          customerMessage: input.customerMessage,
          estimatedCompletionAt: input.estimatedCompletionAt,
          visibleToCustomer: input.visibleToCustomer,
        })
      }
      const { data, error } = await supabase.rpc('transition_workshop_stage', {
        p_request_id: input.requestId,
        p_new_stage: input.newStage,
        p_internal_note: input.internalNote,
        p_customer_message: input.customerMessage,
        p_estimated_completion_at: input.estimatedCompletionAt,
        p_visible_to_customer: input.visibleToCustomer,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_event, input) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-timeline', input.requestId] })
      queryClient.invalidateQueries({ queryKey: ['requests', 'garage', input.garageId] })
      queryClient.invalidateQueries({ queryKey: ['requests', 'client', input.clientId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', input.garageId] })
    },
  })
}
