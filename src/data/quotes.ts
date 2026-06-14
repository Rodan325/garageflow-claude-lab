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

export interface NewQuoteInput {
  quote: TablesInsert<'quotes'>
  lines: Omit<TablesInsert<'quote_lines'>, 'quote_id'>[]
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ quote, lines }: NewQuoteInput): Promise<Quote> => {
      if (isDemo()) return demo.createQuote(quote as Partial<Quote>, lines as Partial<QuoteLine>[])
      const { data: q, error } = await supabase.from('quotes').insert(quote).select('*').single()
      if (error) throw error
      if (lines.length) {
        const { error: le } = await supabase
          .from('quote_lines')
          .insert(lines.map((l, i) => ({ ...l, quote_id: q.id, sort_order: l.sort_order ?? i })))
        if (le) throw le
      }
      return q
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['quotes', row.garage_id] })
    },
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quote, lines }: { id: string; garageId: string; quote: Partial<TablesInsert<'quotes'>>; lines: Omit<TablesInsert<'quote_lines'>, 'quote_id'>[] }) => {
      if (isDemo()) return demo.updateQuoteFull(id, quote as Partial<Quote>, lines as Partial<QuoteLine>[])
      const { error } = await supabase.from('quotes').update(quote).eq('id', id)
      if (error) throw error
      const { error: de } = await supabase.from('quote_lines').delete().eq('quote_id', id)
      if (de) throw de
      if (lines.length) {
        const { error: le } = await supabase
          .from('quote_lines')
          .insert(lines.map((l, i) => ({ ...l, quote_id: id, sort_order: l.sort_order ?? i })))
        if (le) throw le
      }
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
