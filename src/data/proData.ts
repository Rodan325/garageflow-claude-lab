import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isDemo, demo } from '@/lib/demo'
import type {
  Appointment, Customer, GarageMember, Profile, Quote, Repair, RepairStatus, Task, Vehicle,
} from '@/types/domain'
import type { TablesInsert } from '@/types/database.types'

export interface DashboardStats {
  pendingRequests: number
  todayAppointments: number
  openRepairs: number
  openTasks: number
  vehicles: number
  customers: number
}

export function useDashboardStats(garageId?: string) {
  return useQuery({
    queryKey: ['dashboard', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<DashboardStats> => {
      if (isDemo()) return demo.dashboardStats()
      const gid = garageId!
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
      const head = { count: 'exact' as const, head: true }
      const [pending, appts, repairs, tasks, vehicles, customers] = await Promise.all([
        supabase.from('service_requests').select('*', head).eq('garage_id', gid).eq('status', 'pending'),
        supabase.from('appointments').select('*', head).eq('garage_id', gid).gte('starts_at', startOfDay.toISOString()).lte('starts_at', endOfDay.toISOString()),
        supabase.from('repairs').select('*', head).eq('garage_id', gid).neq('status', 'delivered'),
        supabase.from('tasks').select('*', head).eq('garage_id', gid).neq('status', 'done'),
        supabase.from('vehicles').select('*', head).eq('garage_id', gid),
        supabase.from('customers').select('*', head).eq('garage_id', gid),
      ])
      return {
        pendingRequests: pending.count ?? 0,
        todayAppointments: appts.count ?? 0,
        openRepairs: repairs.count ?? 0,
        openTasks: tasks.count ?? 0,
        vehicles: vehicles.count ?? 0,
        customers: customers.count ?? 0,
      }
    },
  })
}

export function useVehicles(garageId?: string) {
  return useQuery({
    queryKey: ['vehicles', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Vehicle[]> => {
      if (isDemo()) return demo.vehicles()
      const { data, error } = await supabase.from('vehicles').select('*').eq('garage_id', garageId!).order('updated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'vehicles'>) => {
      if (isDemo()) return demo.createVehicle(input as Partial<Vehicle>)
      const { data, error } = await supabase.from('vehicles').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['vehicles', row.garage_id] })
      qc.invalidateQueries({ queryKey: ['dashboard', row.garage_id] })
    },
  })
}

export function useCustomers(garageId?: string) {
  return useQuery({
    queryKey: ['customers', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Customer[]> => {
      if (isDemo()) return demo.customers()
      const { data, error } = await supabase.from('customers').select('*').eq('garage_id', garageId!).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'customers'>) => {
      if (isDemo()) return demo.createCustomer(input as Partial<Customer>)
      const { data, error } = await supabase.from('customers').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['customers', row.garage_id] })
      qc.invalidateQueries({ queryKey: ['dashboard', row.garage_id] })
    },
  })
}

export function useRepairs(garageId?: string) {
  return useQuery({
    queryKey: ['repairs', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Repair[]> => {
      if (isDemo()) return demo.repairs()
      const { data, error } = await supabase.from('repairs').select('*').eq('garage_id', garageId!).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateRepairStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RepairStatus; garageId: string }) => {
      if (isDemo()) return demo.updateRepairStatus(id, status)
      const { error } = await supabase.from('repairs').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['repairs', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['dashboard', vars.garageId] })
    },
  })
}

export function useCreateRepair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'repairs'>) => {
      if (isDemo()) return demo.createRepair(input as Partial<Repair>)
      const { data, error } = await supabase.from('repairs').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['repairs', row.garage_id] })
      qc.invalidateQueries({ queryKey: ['dashboard', row.garage_id] })
    },
  })
}

export function useTasks(garageId?: string) {
  return useQuery({
    queryKey: ['tasks', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Task[]> => {
      if (isDemo()) return demo.tasks()
      const { data, error } = await supabase.from('tasks').select('*').eq('garage_id', garageId!).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; garageId: string }) => {
      if (isDemo()) return demo.toggleTask(id, status)
      const completed_at = status === 'done' ? new Date().toISOString() : null
      const { error } = await supabase.from('tasks').update({ status, completed_at }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.garageId] })
      qc.invalidateQueries({ queryKey: ['dashboard', vars.garageId] })
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'tasks'>) => {
      if (isDemo()) return demo.createTask(input as Partial<Task>)
      const { data, error } = await supabase.from('tasks').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['tasks', row.garage_id] })
      qc.invalidateQueries({ queryKey: ['dashboard', row.garage_id] })
    },
  })
}

export function useAppointments(garageId?: string) {
  return useQuery({
    queryKey: ['appointments', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Appointment[]> => {
      if (isDemo()) return demo.appointments()
      const { data, error } = await supabase.from('appointments').select('*').eq('garage_id', garageId!).order('starts_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TablesInsert<'appointments'>) => {
      if (isDemo()) return demo.createAppointment(input as Partial<Appointment>)
      const { data, error } = await supabase.from('appointments').insert(input).select('*').single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['appointments', row.garage_id] })
      qc.invalidateQueries({ queryKey: ['dashboard', row.garage_id] })
    },
  })
}

export function useQuotes(garageId?: string) {
  return useQuery({
    queryKey: ['quotes', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<Quote[]> => {
      if (isDemo()) return demo.quotes()
      const { data, error } = await supabase.from('quotes').select('*').eq('garage_id', garageId!).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export interface TeamMember extends GarageMember {
  profile: Profile | null
}

export function useTeam(garageId?: string) {
  return useQuery({
    queryKey: ['team', garageId],
    enabled: !!garageId,
    queryFn: async (): Promise<TeamMember[]> => {
      if (isDemo()) return demo.team()
      const { data: members, error } = await supabase.from('garage_members').select('*').eq('garage_id', garageId!).order('created_at')
      if (error) throw error
      const ids = (members ?? []).map((m) => m.user_id)
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
      return (members ?? []).map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }))
    },
  })
}
