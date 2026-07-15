import { useQuery } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { notificationsEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import type { NotificationOutboxItem } from '@/features/notifications/model'

export function useNotificationOutbox(garageId?: string) {
  return useQuery({
    queryKey: ['notification-outbox', garageId],
    enabled: !!garageId && notificationsEnabled(),
    queryFn: async (): Promise<NotificationOutboxItem[]> => {
      if (isDemo()) return demo.notificationOutbox(garageId!)
      const { data, error } = await supabase
        .from('notification_outbox')
        .select('*')
        .eq('garage_id', garageId!)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as unknown as NotificationOutboxItem[]
    },
  })
}
