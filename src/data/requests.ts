import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type { RequestStatus, ServiceRequest, ServiceRequestMessage } from '@/types/domain'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

export function useGarageRequests(garageId?: string) {
  return useQuery({
    queryKey: ['requests', 'garage', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<ServiceRequest[]> => {
      if (isDemo()) return demo.garageRequests()
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('garage_id', garageId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useClientRequests(clientId?: string | null) {
  return useQuery({
    queryKey: ['requests', 'client', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ServiceRequest[]> => {
      if (isDemo()) return demo.clientRequests()
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useRequestMessages(requestId?: string) {
  return useQuery({
    queryKey: ['request-messages', requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<ServiceRequestMessage[]> => {
      if (isDemo()) return demo.requestMessages(requestId!)
      const { data, error } = await supabase
        .from('service_request_messages')
        .select('*')
        .eq('request_id', requestId!)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'service_requests'>): Promise<ServiceRequest> => {
      if (isDemo()) return demo.createRequest(input as Partial<ServiceRequest>)
      const { data, error } = await supabase.from('service_requests').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['requests', 'client', row.client_id] })
      qc.invalidateQueries({ queryKey: ['requests', 'garage', row.garage_id] })
    },
  })
}

interface StatusUpdate {
  id: string
  garageId: string
  clientId: string
  status: RequestStatus
  proposed_date?: string | null
  proposed_time?: string | null
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, proposed_date, proposed_time }: StatusUpdate) => {
      const patch: TablesUpdate<'service_requests'> = { status }
      if (proposed_date !== undefined) patch.proposed_date = proposed_date
      if (proposed_time !== undefined) patch.proposed_time = proposed_time
      if (isDemo()) return demo.updateRequestStatus(id, patch as Partial<ServiceRequest>)
      const { data, error } = await supabase
        .from('service_requests')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['requests', 'garage', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['requests', 'client', vars.clientId] })
      qc.invalidateQueries({ queryKey: ['dashboard', vars.garageId] })
    },
  })
}

export function useAddRequestMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'service_request_messages'>) => {
      if (isDemo()) return demo.addRequestMessage(input as Partial<ServiceRequestMessage>)
      const { data, error } = await supabase
        .from('service_request_messages')
        .insert(input)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => qc.invalidateQueries({ queryKey: ['request-messages', row.request_id] }),
  })
}

export function useConvertRequestToAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string; garageId: string }) => {
      if (isDemo()) return demo.convertRequest(requestId)
      const { data, error } = await supabase.functions.invoke('request-to-appointment', {
        body: { request_id: requestId },
      })
      if (error) throw error
      return data as { appointment_id: string; customer_id: string }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['requests', 'garage', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['appointments', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['customers', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['dashboard', vars.garageId] })
    },
  })
}
