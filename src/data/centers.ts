import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import { centersEnabled, isMissingSchemaError } from '@/lib/features'
import type { GarageCenter } from '@/types/domain'

/** Active centers of a garage — public directory read (client booking). */
export function useGarageCenters(garageId?: string) {
  return useQuery({
    queryKey: ['centers', garageId],
    // Gated: in real mode only when the feature flag is on, so a production DB
    // without garage_centers is never queried.
    enabled: !!garageId && centersEnabled(),
    queryFn: async (): Promise<GarageCenter[]> => {
      if (isDemo()) return demo.centers()
      const { data, error } = await supabase
        .from('garage_centers')
        .select('*')
        .eq('garage_id', garageId!)
        .eq('is_active', true)
        .order('sort_order')
      // Fail soft if the table isn't there yet (migration not applied): the app
      // simply behaves as "no centers" instead of crashing the booking flow.
      if (error) {
        if (isMissingSchemaError(error)) return []
        throw error
      }
      return data ?? []
    },
  })
}

/** All centers (active + inactive) for the garage management view. */
export function useManageCenters(garageId?: string) {
  return useQuery({
    queryKey: ['centers-all', garageId],
    enabled: !!garageId && centersEnabled(),
    queryFn: async (): Promise<GarageCenter[]> => {
      if (isDemo()) return demo.allCenters()
      const { data, error } = await supabase
        .from('garage_centers')
        .select('*')
        .eq('garage_id', garageId!)
        .order('sort_order')
      if (error) {
        if (isMissingSchemaError(error)) return []
        throw error
      }
      return data ?? []
    },
  })
}
