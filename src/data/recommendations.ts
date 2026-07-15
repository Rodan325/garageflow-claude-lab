import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { legalVersions } from '@/config/legal'
import { demo, isDemo } from '@/lib/demo'
import { recommendationsEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import type { Lang } from '@/i18n'
import type {
  RecommendationDecision,
  RecommendationDecisionEvent,
  RecommendationStatus,
  RecommendationUrgency,
  WorkshopRecommendation,
} from '@/features/recommendations/model'

export function useRecommendations(requestId?: string, customerView = false) {
  return useQuery({
    queryKey: ['recommendations', requestId, customerView],
    enabled: !!requestId && recommendationsEnabled(),
    queryFn: async (): Promise<WorkshopRecommendation[]> => {
      if (isDemo()) return demo.recommendations(requestId!, customerView)
      let query = supabase
        .from('workshop_recommendations')
        .select('*')
        .eq('service_request_id', requestId!)
        .order('created_at', { ascending: false })
      if (customerView) query = query.not('status', 'in', '(draft,cancelled)')
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as WorkshopRecommendation[]
    },
  })
}

export function useRecommendationDecisions(recommendationId?: string, customerView = false) {
  return useQuery({
    queryKey: ['recommendation-decisions', recommendationId, customerView],
    enabled: !!recommendationId && recommendationsEnabled(),
    queryFn: async (): Promise<RecommendationDecisionEvent[]> => {
      if (isDemo()) return demo.recommendationDecisions(recommendationId!, customerView)
      const { data, error } = await supabase
        .from('recommendation_decisions')
        .select('*')
        .eq('recommendation_id', recommendationId!)
        .order('occurred_at')
      if (error) throw error
      return (data ?? []) as RecommendationDecisionEvent[]
    },
  })
}

export interface CreateRecommendationInput {
  requestId: string
  title: string
  description?: string | null
  category?: string | null
  urgency?: RecommendationUrgency
  reason?: string | null
  estimatedPrice?: number | null
  estimatedDurationMinutes?: number | null
  affectsDeliveryTime?: boolean
  proposedDeliveryAt?: string | null
}

export function useCreateRecommendation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateRecommendationInput): Promise<WorkshopRecommendation> => {
      if (!recommendationsEnabled()) throw new Error('Recommendations are disabled')
      if (isDemo()) return demo.createRecommendation(input)
      const { data, error } = await supabase.rpc('create_workshop_recommendation', {
        p_request_id: input.requestId,
        p_title: input.title,
        p_description: input.description,
        p_category: input.category,
        p_urgency: input.urgency,
        p_reason: input.reason,
        p_estimated_price: input.estimatedPrice,
        p_estimated_duration_minutes: input.estimatedDurationMinutes,
        p_affects_delivery_time: input.affectsDeliveryTime,
        p_proposed_delivery_at: input.proposedDeliveryAt,
      })
      if (error) throw error
      return data as WorkshopRecommendation
    },
    onSuccess: (row) => queryClient.invalidateQueries({ queryKey: ['recommendations', row.service_request_id] }),
  })
}

export function useSetRecommendationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { recommendationId: string; requestId: string; newStatus: RecommendationStatus; note?: string | null }) => {
      if (!recommendationsEnabled()) throw new Error('Recommendations are disabled')
      if (isDemo()) return demo.setRecommendationStatus(input.recommendationId, input.newStatus, input.note)
      const { data, error } = await supabase.rpc('set_workshop_recommendation_status', {
        p_recommendation_id: input.recommendationId,
        p_new_status: input.newStatus,
        p_note: input.note,
      })
      if (error) throw error
      return data as WorkshopRecommendation
    },
    onSuccess: (_row, input) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', input.requestId] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-decisions', input.recommendationId] })
    },
  })
}

export function useDecideRecommendation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      recommendationId: string
      requestId: string
      action: RecommendationDecision
      note?: string | null
      language: Lang
    }) => {
      if (!recommendationsEnabled()) throw new Error('Recommendations are disabled')
      if (isDemo()) return demo.decideRecommendation(input)
      const { data, error } = await supabase.rpc('decide_workshop_recommendation', {
        p_recommendation_id: input.recommendationId,
        p_action: input.action,
        p_note: input.note,
        p_terms_version: legalVersions.terms,
        p_privacy_version: legalVersions.privacy,
        p_displayed_language: input.language,
      })
      if (error) throw error
      return data as WorkshopRecommendation
    },
    onSuccess: (_row, input) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', input.requestId] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-decisions', input.recommendationId] })
    },
  })
}

export function useLinkRecommendationQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { recommendationId: string; quoteId: string; parentQuoteId?: string | null }) => {
      if (!recommendationsEnabled()) throw new Error('Recommendations are disabled')
      if (isDemo()) return demo.linkRecommendationQuote(input.recommendationId, input.quoteId, input.parentQuoteId)
      const { data, error } = await supabase.rpc('link_recommendation_quote', {
        p_recommendation_id: input.recommendationId,
        p_quote_id: input.quoteId,
        p_supplemental_to_quote_id: input.parentQuoteId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quote.id] })
      queryClient.invalidateQueries({ queryKey: ['quotes', quote.garage_id] })
    },
  })
}
