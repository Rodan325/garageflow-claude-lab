import { useQuery } from '@tanstack/react-query'
import { useAppointments, useQuotes } from '@/data/proData'
import { useGarageRequests } from '@/data/requests'
import { useManageCenters } from '@/data/centers'
import { useMaintenanceReminders } from '@/data/reminders'
import { demo, isDemo } from '@/lib/demo'
import { networkDashboardEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import { aggregateNetworkDashboard, type CenterNetworkMetrics } from '@/features/network/model'

export function useNetworkDashboard(garageId?: string) {
  const demoMode = isDemo()
  const centers = useManageCenters(garageId)
  const requests = useGarageRequests(demoMode ? garageId : undefined)
  const quotes = useQuotes(demoMode ? garageId : undefined)
  const appointments = useAppointments(demoMode ? garageId : undefined)
  const reminders = useMaintenanceReminders(demoMode ? garageId : undefined)
  const remote = useQuery({
    queryKey: ['network-dashboard', garageId],
    enabled: !!garageId && networkDashboardEnabled() && !demoMode,
    queryFn: async (): Promise<CenterNetworkMetrics[]> => {
      const { data, error } = await supabase.rpc('get_network_dashboard', {
        p_garage_id: garageId!, p_start: null, p_end: null,
      })
      if (error) throw error
      return data as CenterNetworkMetrics[]
    },
  })
  const demoRows = demoMode && networkDashboardEnabled()
    ? aggregateNetworkDashboard({
        centers: centers.data ?? demo.allCenters(), requests: requests.data ?? demo.garageRequests(),
        quotes: quotes.data ?? demo.quotes(), appointments: appointments.data ?? demo.appointments(),
        reminders: reminders.data ?? demo.maintenanceReminders(garageId),
      })
    : []
  return {
    data: demoMode ? demoRows : remote.data,
    centers: centers.data ?? [],
    isLoading: demoMode ? false : remote.isLoading || centers.isLoading,
    error: remote.error,
  }
}
