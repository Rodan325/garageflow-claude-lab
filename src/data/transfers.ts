import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { supabase } from '@/lib/supabase'
import type { ServiceRequestTransfer } from '@/features/transfers/model'

const asTransfer = (row: Record<string, unknown>) => row as unknown as ServiceRequestTransfer

export function useRequestTransfers(requestId?: string) {
  return useQuery({
    queryKey: ['center-transfers', requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<ServiceRequestTransfer[]> => {
      if (isDemo()) return demo.serviceRequestTransfers(requestId!)
      const { data, error } = await supabase
        .from('service_request_transfers')
        .select('*')
        .eq('service_request_id', requestId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(asTransfer)
    },
  })
}

export function useProposeCenterTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      requestId: string
      garageId: string
      destinationCenterId: string
      reason?: string | null
    }): Promise<ServiceRequestTransfer> => {
      if (isDemo()) return demo.proposeCenterTransfer(input.requestId, input.destinationCenterId, input.reason)
      const { data, error } = await supabase.rpc('propose_center_transfer', {
        p_request_id: input.requestId,
        p_to_center_id: input.destinationCenterId,
        p_reason: input.reason ?? null,
      })
      if (error) throw error
      return asTransfer(data)
    },
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: ['center-transfers', transfer.service_request_id] })
      queryClient.invalidateQueries({ queryKey: ['requests', 'garage', transfer.garage_id] })
    },
  })
}

export function useDecideCenterTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { transferId: string; accept: boolean; note?: string | null }) => {
      const row = isDemo()
        ? demo.transitionCenterTransfer(input.transferId, input.accept ? 'confirm' : 'decline', input.note)
        : await (async () => {
            const { data, error } = await supabase.rpc('decide_center_transfer', {
              p_transfer_id: input.transferId, p_accept: input.accept, p_note: input.note ?? null,
            })
            if (error) throw error
            return asTransfer(data)
          })()
      return row
    },
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: ['center-transfers', transfer.service_request_id] })
    },
  })
}

export function useCompleteCenterTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { transferId: string; requestId: string; garageId: string }) => {
      if (isDemo()) return demo.transitionCenterTransfer(input.transferId, 'complete')
      const { data, error } = await supabase.rpc('complete_center_transfer', { p_transfer_id: input.transferId })
      if (error) throw error
      return asTransfer(data)
    },
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: ['center-transfers', transfer.service_request_id] })
      queryClient.invalidateQueries({ queryKey: ['requests', 'garage', transfer.garage_id] })
      queryClient.invalidateQueries({ queryKey: ['appointments', transfer.garage_id] })
    },
  })
}
