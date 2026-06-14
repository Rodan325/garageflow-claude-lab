import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type { Garage, GarageHours, GarageNews, GarageService } from '@/types/domain'

export function useGarages() {
  return useQuery({
    queryKey: ['garages'],
    queryFn: async (): Promise<Garage[]> => {
      if (isDemo()) return demo.garages()
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .eq('is_public', true)
        .order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useGarageBySlug(slug?: string) {
  return useQuery({
    queryKey: ['garage', 'slug', slug],
    enabled: !!slug,
    queryFn: async (): Promise<Garage | null> => {
      if (isDemo()) return demo.garages().find((g) => g.slug === slug) ?? null
      const { data, error } = await supabase.from('garages').select('*').eq('slug', slug!).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useGarageServices(garageId?: string) {
  return useQuery({
    queryKey: ['services', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<GarageService[]> => {
      if (isDemo()) return demo.services()
      const { data, error } = await supabase
        .from('garage_services')
        .select('*')
        .eq('garage_id', garageId!)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useGarageNews(garageId?: string) {
  return useQuery({
    queryKey: ['news', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<GarageNews[]> => {
      if (isDemo()) return demo.news()
      const { data, error } = await supabase
        .from('garage_news')
        .select('*')
        .eq('garage_id', garageId!)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useGarageHours(garageId?: string) {
  return useQuery({
    queryKey: ['hours', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<GarageHours[]> => {
      if (isDemo()) return demo.hours()
      const { data, error } = await supabase
        .from('garage_hours')
        .select('*')
        .eq('garage_id', garageId!)
        .order('weekday')
      if (error) throw error
      return data ?? []
    },
  })
}
