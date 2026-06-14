import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { env, isSupabaseConfigured } from './env'

/**
 * Typed Supabase browser client. Uses the public anon/publishable key with
 * RLS enforced server-side. If env is missing we still create a client with
 * placeholder values so imports don't crash — guarded by isSupabaseConfigured.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'public-anon-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'garageflow-auth',
    },
  },
)

export { isSupabaseConfigured }
