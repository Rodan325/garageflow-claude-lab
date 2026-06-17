import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
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

export function useUpdateQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; garageId: string }) => {
      if (isDemo()) return demo.updateQuoteStatus(id, status)
      const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['quotes', v.garageId] })
      qc.invalidateQueries({ queryKey: ['quote', v.id] })
    },
  })
}
