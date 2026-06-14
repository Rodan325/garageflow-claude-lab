import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type { GarageService } from '@/types/domain'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

/** All services (active + inactive) for the garage management view. */
export function useManageServices(garageId?: string) {
  return useQuery({
    queryKey: ['services-all', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<GarageService[]> => {
      if (isDemo()) return demo.allServices()
      const { data, error } = await supabase
        .from('garage_services')
        .select('*')
        .eq('garage_id', garageId!)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })
}

function invalidateServices(qc: ReturnType<typeof useQueryClient>, garageId?: string) {
  qc.invalidateQueries({ queryKey: ['services', garageId] })
  qc.invalidateQueries({ queryKey: ['services-all', garageId] })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'garage_services'>) => {
      if (isDemo()) return demo.createService(input as Partial<GarageService>)
      const { data, error } = await supabase.from('garage_services').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => invalidateServices(qc, row.garage_id),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; garageId: string; patch: TablesUpdate<'garage_services'> }) => {
      if (isDemo()) return demo.updateService(id, patch as Partial<GarageService>)
      const { error } = await supabase.from('garage_services').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidateServices(qc, v.garageId),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; garageId: string }) => {
      if (isDemo()) return demo.deleteService(id)
      const { error } = await supabase.from('garage_services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidateServices(qc, v.garageId),
  })
}

/** Update garage identity / branding fields. */
export function useUpdateGarage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'garages'> }) => {
      if (isDemo()) return demo.updateGarage(patch)
      const { error } = await supabase.from('garages').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garages'] })
      qc.invalidateQueries({ queryKey: ['garage'] })
    },
  })
}

/** Upload a logo to Supabase Storage (real mode only) and return its public URL. */
export function useUploadLogo() {
  return useMutation({
    mutationFn: async ({ garageId, file }: { garageId: string; file: File }) => {
      if (isDemo()) throw new Error('Le téléversement du logo nécessite une connexion Supabase (indisponible en démo).')
      const ext = file.name.split('.').pop() || 'png'
      const path = `${garageId}/logo-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('garage-logos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('garage-logos').getPublicUrl(path)
      return data.publicUrl
    },
  })
}
