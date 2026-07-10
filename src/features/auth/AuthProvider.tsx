import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Garage, GarageMember, GarageRole, Profile } from '@/types/domain'
import { queryClient } from '@/lib/queryClient'
import { mapAuthError } from './authErrors'
import {
  clearDemo,
  demoGarage,
  demoProfile,
  DEMO_CLIENT_ID,
  DEMO_STAFF_ID,
  getDemoKind,
  setDemoKind,
  reloadDemoCache,
  STORE_KEY,
  type DemoKind,
} from '@/lib/demo'

interface SignUpInput {
  email: string
  password: string
  fullName: string
  phone?: string
  accountType: 'staff' | 'client'
}

export type SignUpResult = {
  error: string | null
  /** True when Supabase created the user but requires email confirmation (no session yet). */
  needsEmailConfirmation?: boolean
  email?: string
}

interface AuthContextValue {
  ready: boolean
  configured: boolean
  /** Truthy when the user can access a protected area (real session OR demo). */
  authed: boolean
  demo: DemoKind | null
  session: Session | null
  userId: string | null
  email: string | null
  profile: Profile | null
  accountType: 'staff' | 'client' | null
  membership: GarageMember | null
  garage: Garage | null
  role: GarageRole | null
  isStaff: boolean
  isClient: boolean
  enterDemo: (kind: DemoKind) => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<SignUpResult>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [demo, setDemo] = useState<DemoKind | null>(() => getDemoKind())
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [membership, setMembership] = useState<GarageMember | null>(null)
  const [garage, setGarage] = useState<Garage | null>(null)
  const loadingRef = useRef(false)

  const loadAccount = useCallback(async (uid: string) => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      setProfile(prof ?? null)
      if (prof?.account_type === 'staff') {
        const { data: mem } = await supabase
          .from('garage_members')
          .select('*')
          .eq('user_id', uid)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        setMembership(mem ?? null)
        if (mem) {
          const { data: g } = await supabase.from('garages').select('*').eq('id', mem.garage_id).maybeSingle()
          setGarage(g ?? null)
        } else setGarage(null)
      } else {
        setMembership(null)
        setGarage(null)
      }
    } finally {
      loadingRef.current = false
    }
  }, [])

  // Real Supabase session lifecycle (skipped while in demo mode).
  useEffect(() => {
    if (getDemoKind()) {
      setReady(true)
      return
    }
    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadAccount(data.session.user.id)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s?.user) await loadAccount(s.user.id)
      else {
        setProfile(null)
        setMembership(null)
        setGarage(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadAccount, demo])

  // Role changes are PER-TAB (sessionStorage) → only react to in-tab role events,
  // never to cross-tab `storage` events (which would leak the other tab's role).
  // Shared demo DATA lives in localStorage → on a cross-tab data change, drop the
  // cache and refetch so e.g. a client's new request shows up in the garage tab.
  useEffect(() => {
    const onRole = () => setDemo(getDemoKind())
    const onData = () => { reloadDemoCache(); if (getDemoKind()) queryClient.invalidateQueries() }
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith(STORE_KEY)) onData() }
    window.addEventListener('gf-demo-role', onRole)
    window.addEventListener('gf-demo-data', onData)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('gf-demo-role', onRole)
      window.removeEventListener('gf-demo-data', onData)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const enterDemo = useCallback((kind: DemoKind) => {
    setDemoKind(kind)
    setDemo(kind)
    setReady(true)
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (input) => {
    const email = input.email.trim()
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: { data: { full_name: input.fullName, phone: input.phone ?? '', account_type: input.accountType } },
      })
      if (error) return { error: mapAuthError(error) }
      // Session present → auto sign-in (email confirmation disabled).
      if (data.session) return { error: null, needsEmailConfirmation: false, email }
      // User created but no session → Supabase awaits email confirmation.
      return { error: null, needsEmailConfirmation: true, email }
    } catch (e) {
      // Network / unexpected failures are thrown rather than returned.
      return { error: mapAuthError(e) }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (getDemoKind()) {
      clearDemo()
      setDemo(null)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
    setMembership(null)
    setGarage(null)
  }, [])

  const refresh = useCallback(async () => {
    if (session?.user) await loadAccount(session.user.id)
  }, [session, loadAccount])

  const value = useMemo<AuthContextValue>(() => {
    // Demo mode: synthesize a session-like state.
    if (demo) {
      const prof = demoProfile(demo) as Profile
      return {
        ready: true,
        configured: isSupabaseConfigured,
        authed: true,
        demo,
        session: null,
        userId: demo === 'garage' ? DEMO_STAFF_ID : DEMO_CLIENT_ID,
        email: demo === 'garage' ? 'owner@demo-garage.fr' : 'client@demo.fr',
        profile: prof,
        accountType: demo === 'garage' ? 'staff' : 'client',
        membership: null,
        garage: demo === 'garage' ? demoGarage() : null,
        role: demo === 'garage' ? 'owner' : null,
        isStaff: demo === 'garage',
        isClient: demo === 'client',
        enterDemo,
        signIn,
        signUp,
        signOut,
        refresh,
      }
    }
    const accountType = (profile?.account_type as 'staff' | 'client' | undefined) ?? null
    return {
      ready,
      configured: isSupabaseConfigured,
      authed: !!session,
      demo: null,
      session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      profile,
      accountType,
      membership,
      garage,
      role: (membership?.role as GarageRole | undefined) ?? null,
      isStaff: accountType === 'staff',
      isClient: accountType === 'client',
      enterDemo,
      signIn,
      signUp,
      signOut,
      refresh,
    }
  }, [demo, ready, session, profile, membership, garage, enterDemo, signIn, signUp, signOut, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
