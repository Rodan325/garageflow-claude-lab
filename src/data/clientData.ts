import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type { ClientProfile, ClientVehicle, Profile } from '@/types/domain'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

export function useClientVehicles(clientId?: string | null) {
  return useQuery({
    queryKey: ['client-vehicles', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ClientVehicle[]> => {
      if (isDemo()) return demo.clientVehicles()
      const { data, error } = await supabase
        .from('client_vehicles')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpsertClientVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'client_vehicles'>) => {
      if (isDemo()) return demo.upsertClientVehicle(input as Partial<ClientVehicle>)
      const { data, error } = await supabase.from('client_vehicles').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => qc.invalidateQueries({ queryKey: ['client-vehicles', row.client_id] }),
  })
}

export function useUpdateClientVehicle(clientId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'client_vehicles'> }) => {
      if (isDemo()) return demo.updateClientVehicle(id, patch as Partial<ClientVehicle>)
      const { data, error } = await supabase.from('client_vehicles').update(patch).eq('id', id).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-vehicles', clientId] }),
  })
}

export function useDeleteClientVehicle(clientId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demo.deleteClientVehicle(id)
      const { error } = await supabase.from('client_vehicles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-vehicles', clientId] }),
  })
}

export function useClientProfile(clientId?: string | null) {
  return useQuery({
    queryKey: ['client-profile', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ClientProfile | null> => {
      if (isDemo()) return demo.clientProfile()
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', clientId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateClientProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      default_garage_id,
      marketing_consent,
    }: {
      id: string
      default_garage_id?: string | null
      marketing_consent?: boolean
    }) => {
      const patch: TablesUpdate<'client_profiles'> = {}
      if (default_garage_id !== undefined) patch.default_garage_id = default_garage_id
      if (marketing_consent !== undefined) patch.marketing_consent = marketing_consent
      if (isDemo()) return demo.updateClientProfile(patch as Partial<ClientProfile>)
      const { error } = await supabase.from('client_profiles').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['client-profile', vars.id] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, full_name, phone }: { id: string; full_name?: string; phone?: string }) => {
      if (isDemo()) return { id, full_name, phone } as unknown as Profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name, phone })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}
