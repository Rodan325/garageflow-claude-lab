import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { deliveryReportsEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import type { DeliveryReport } from '@/features/reports/model'

export function useDeliveryReport(requestId?: string, customerView = false) {
  return useQuery({
    queryKey: ['delivery-report', requestId, customerView],
    enabled: !!requestId && deliveryReportsEnabled(),
    queryFn: async (): Promise<DeliveryReport | null> => {
      if (isDemo()) return demo.deliveryReport(requestId!, customerView)
      let query = supabase.from('delivery_reports').select('*').eq('service_request_id', requestId!)
      if (customerView) query = query.eq('status', 'finalized')
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      return data as unknown as DeliveryReport | null
    },
  })
}

export function useSaveDeliveryReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { requestId: string; report: Partial<DeliveryReport>; finalize?: boolean }) => {
      if (!deliveryReportsEnabled()) throw new Error('Delivery reports are disabled')
      if (isDemo()) return demo.saveDeliveryReport(input.requestId, input.report, input.finalize)
      const { data, error } = await supabase.rpc('save_delivery_report', {
        p_request_id: input.requestId,
        p_report: input.report as unknown as never,
        p_finalize: input.finalize,
      })
      if (error) throw error
      return data as unknown as DeliveryReport
    },
    onSuccess: (report) => queryClient.invalidateQueries({ queryKey: ['delivery-report', report.service_request_id] }),
  })
}
