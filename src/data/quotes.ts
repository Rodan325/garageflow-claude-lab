import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo, canResolveDemoPublicQuote } from '@/lib/demo'
import { legalVersions } from '@/config/legal'
import type { Quote, QuoteLine } from '@/types/domain'
import type { TablesInsert } from '@/types/database.types'

export function useQuote(id?: string) {
  return useQuery({
    queryKey: ['quote', id],
    enabled: !!id,
    queryFn: async (): Promise<Quote | null> => {
      if (isDemo()) return demo.quote(id!)
      const { data, error } = await supabase.from('quotes').select('*').eq('id', id!).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useQuoteLines(quoteId?: string) {
  return useQuery({
    queryKey: ['quote-lines', quoteId],
    enabled: !!quoteId,
    queryFn: async (): Promise<QuoteLine[]> => {
      if (isDemo()) return demo.quoteLines(quoteId!)
      const { data, error } = await supabase
        .from('quote_lines')
        .select('*')
        .eq('quote_id', quoteId!)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })
}

/** Extra (non-column) flag read by the RPC to authorise a cross-client vehicle. */
type QuoteInput = Omit<TablesInsert<'quotes'>, 'number'> & { cross_customer_vehicle_confirmed?: boolean }

export interface NewQuoteInput {
  /** Number + totals are assigned/recomputed server-side — not trusted from the caller. */
  quote: QuoteInput
  lines: Omit<TablesInsert<'quote_lines'>, 'quote_id'>[]
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ quote, lines }: NewQuoteInput): Promise<Quote> => {
      if (isDemo()) {
        const number = demo.nextQuoteNumber()
        return demo.createQuote({ ...quote, number } as Partial<Quote>, lines as Partial<QuoteLine>[])
      }
      // Atomic: number + quote + lines in one transaction (DV-YYYY-NNNN).
      const { data, error } = await supabase.rpc('create_quote_with_lines', {
        p_quote: quote as unknown as never,
        p_lines: lines as unknown as never,
      })
      if (error) throw error
      return data as unknown as Quote
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['quotes', row.garage_id] })
    },
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quote, lines }: { id: string; garageId: string; quote: QuoteInput; lines: Omit<TablesInsert<'quote_lines'>, 'quote_id'>[] }) => {
      if (isDemo()) return demo.updateQuoteFull(id, quote as Partial<Quote>, lines as Partial<QuoteLine>[])
      // Atomic: update quote + replace lines in one transaction (never lose lines).
      const { error } = await supabase.rpc('update_quote_with_lines', {
        p_id: id,
        p_quote: quote as unknown as never,
        p_lines: lines as unknown as never,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['quotes', v.garageId] })
      qc.invalidateQueries({ queryKey: ['quote', v.id] })
      qc.invalidateQueries({ queryKey: ['quote-lines', v.id] })
    },
  })
}

/** Garage action: send a draft to the client (server mints the share token). */
export function useSendQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; garageId: string }): Promise<Quote> => {
      if (isDemo()) return demo.sendQuote(id)
      const { data, error } = await supabase.rpc('send_quote', { p_id: id })
      if (error) throw error
      return data as unknown as Quote
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['quotes', v.garageId] })
      qc.invalidateQueries({ queryKey: ['quote', v.id] })
    },
  })
}

/** Garage action: create a fresh DRAFT revision from any quote. */
export function useReviseQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; garageId: string }): Promise<Quote> => {
      if (isDemo()) return demo.reviseQuote(id)
      const { data, error } = await supabase.rpc('revise_quote', { p_id: id })
      if (error) throw error
      return data as unknown as Quote
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['quotes', v.garageId] }),
  })
}

// ---- Public (tokenised) consultation + accept / decline -------------------

export interface PublicQuoteLine {
  id: string; label: string; quantity: number; unit_price: number; tax_rate: number; line_total: number; sort_order: number
}
export interface PublicQuoteView {
  quote: {
    id: string; number: string; title: string; status: string
    subtotal: number; tax_total: number; total: number
    notes: string | null; conditions: string | null; valid_until: string | null
    client_name: string | null; client_phone: string | null; client_email: string | null
    vehicle_label: string | null; created_at: string
    sent_at: string | null; accepted_at: string | null; declined_at: string | null; decline_reason: string | null
  }
  lines: PublicQuoteLine[]
  garage: {
    name: string; logo_url: string | null; accent_color: string | null
    address: string | null; city: string | null; phone: string | null; email: string | null
    legal_name: string | null; siret: string | null; vat_number: string | null; legal_info: string | null
  }
}

export function usePublicQuote(token?: string) {
  return useQuery({
    queryKey: ['public-quote', token],
    enabled: !!token,
    queryFn: async (): Promise<PublicQuoteView | null> => {
      if (isDemo()) return demo.getPublicQuote(token!)
      // A demo link opened in a fresh tab (no active demo role): resolve it
      // from the local store instead of asking Supabase for a token it can't have.
      if (canResolveDemoPublicQuote(token)) {
        const local = demo.getPublicQuote(token!)
        if (local) return local
      }
      const { data, error } = await supabase.rpc('get_quote_public', { p_token: token! })
      if (error) throw error
      return (data as unknown as PublicQuoteView | null) ?? null
    },
  })
}

export function useAcceptPublicQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token }: { token: string }): Promise<PublicQuoteView> => {
      if (isDemo()) return demo.acceptPublicQuote(token)
      if (canResolveDemoPublicQuote(token) && demo.getPublicQuote(token)) return demo.acceptPublicQuote(token)
      // Proof: stamp the CGU/privacy versions displayed at acceptance time.
      const { data, error } = await supabase.rpc('accept_quote_public', {
        p_token: token,
        p_terms_version: legalVersions.terms,
        p_privacy_version: legalVersions.privacy,
      })
      if (error) throw error
      return data as unknown as PublicQuoteView
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['public-quote', v.token] }),
  })
}

export function useDeclinePublicQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, reason }: { token: string; reason?: string | null }): Promise<PublicQuoteView> => {
      if (isDemo()) return demo.declinePublicQuote(token, reason ?? null)
      if (canResolveDemoPublicQuote(token) && demo.getPublicQuote(token)) return demo.declinePublicQuote(token, reason ?? null)
      const { data, error } = await supabase.rpc('decline_quote_public', { p_token: token, p_reason: reason ?? undefined })
      if (error) throw error
      return data as unknown as PublicQuoteView
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['public-quote', v.token] }),
  })
}
