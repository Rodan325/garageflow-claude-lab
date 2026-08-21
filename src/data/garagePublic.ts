import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type {
  PublicGarage,
  PublicGarageHours,
  PublicGarageNews,
  PublicGarageService,
} from '@/types/domain'

const PUBLIC_GARAGE_FIELDS = 'id,slug,name,phone,website,address,city,postal_code,country,description,specialties,logo_url,accent_color,maps_url'
const PUBLIC_SERVICE_FIELDS = 'id,garage_id,name,description,category,duration_minutes,price_from,price_type,is_active,sort_order'
const PUBLIC_NEWS_FIELDS = 'id,garage_id,title,body,image_url,published_at'
const PUBLIC_HOURS_FIELDS = 'id,garage_id,weekday,open_time,close_time,is_closed'

export function useGarages() {
  return useQuery({
    queryKey: ['garages'],
    queryFn: async (): Promise<PublicGarage[]> => {
      if (isDemo()) return demo.garages()
      const { data, error } = await supabase
        .from('garages')
        .select(PUBLIC_GARAGE_FIELDS)
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
    queryFn: async (): Promise<PublicGarage | null> => {
      if (isDemo()) return demo.garages().find((g) => g.slug === slug) ?? null
      const { data, error } = await supabase
        .from('garages')
        .select(PUBLIC_GARAGE_FIELDS)
        .eq('slug', slug!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useGarageServices(garageId?: string) {
  return useQuery({
    queryKey: ['services', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<PublicGarageService[]> => {
      if (isDemo()) return demo.services()
      const { data, error } = await supabase
        .from('garage_services')
        .select(PUBLIC_SERVICE_FIELDS)
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
    queryFn: async (): Promise<PublicGarageNews[]> => {
      if (isDemo()) return demo.news()
      const { data, error } = await supabase
        .from('garage_news')
        .select(PUBLIC_NEWS_FIELDS)
        .eq('garage_id', garageId!)
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
    queryFn: async (): Promise<PublicGarageHours[]> => {
      if (isDemo()) return demo.hours()
      const { data, error } = await supabase
        .from('garage_hours')
        .select(PUBLIC_HOURS_FIELDS)
        .eq('garage_id', garageId!)
        .order('weekday')
      if (error) throw error
      return data ?? []
    },
  })
}
