import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarDays, Car, FileText, Gauge, Inbox, LogOut, Menu, ScrollText, Settings, Tags, Users, Wrench, X,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { LegalFooter } from '@/components/common/LegalFooter'
import { SupabaseStatus } from '@/components/common/SupabaseStatus'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageRequests } from '@/data/requests'
import { useProMode } from '@/features/pro/useProMode'
import type { GarageRole } from '@/types/domain'
import { roleLabel } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'
import { useBrand } from '@/branding'
import { cn } from '@/lib/utils'

const essentiel = [
  { to: '/pro', label: 'Tableau de bord', icon: Gauge, end: true },
  { to: '/pro/bookings', label: 'Réservations', icon: Inbox, end: false, badge: true },
  { to: '/pro/calendar', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pro/clients', label: 'Clients', icon: Users, end: false },
  { to: '/pro/vehicles', label: 'Véhicules', icon: Car, end: false },
]
const avance = [
  { to: '/pro/workshop', label: 'Atelier', icon: Wrench, end: false },
  { to: '/pro/services', label: 'Prestations', icon: Tags, end: false },
  { to: '/pro/quotes', label: 'Devis', icon: FileText, end: false },
  { to: '/pro/team', label: 'Équipe', icon: Users, end: false },
]

export function ProShell() {
  const { garage, profile, role, signOut } = useAuth()
  const { brand } = useBrand()
  const navigate = useNavigate()
  const { data: requests } = useGarageRequests(garage?.id)
  const pending = (requests ?? []).filter((r) => r.status === 'pending').length
  const { mode, set } = useProMode()
  const [open, setOpen] = useState(false)
  const { lang, tr } = useLang()

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label={tr('Fermer le menu')}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {essentiel.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={itemClass}>
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{tr(label)}</span>
            {badge && pending > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">{pending}</span>
            )}
          </NavLink>
        ))}

        {mode === 'avance' && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {tr('Atelier & gestion')}
            </p>
            {avance.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={itemClass}>
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{tr(label)}</span>
              </NavLink>
            ))}
          </>
        )}

        <NavLink to="/pro/settings" onClick={() => setOpen(false)} className={(state) => cn(itemClass(state), 'mt-1')}>
          <Settings className="h-[18px] w-[18px]" />
          <span className="flex-1">{tr('Paramètres')}</span>
        </NavLink>
        <NavLink to="/pro/legal-status" onClick={() => setOpen(false)} className={itemClass}>
          <ScrollText className="h-[18px] w-[18px]" />
          <span className="flex-1">{tr('Statut légal')}</span>
        </NavLink>
      </nav>

      {/* Mode switch */}
      <div className="px-3 pb-2">
        <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
          <button
            onClick={() => set('essentiel')}
            className={cn('flex-1 rounded-md py-1.5 transition-colors', mode === 'essentiel' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            {tr('Essentiel')}
          </button>
          <button
            onClick={() => set('avance')}
            className={cn('flex-1 rounded-md py-1.5 transition-colors', mode === 'avance' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            {tr('Atelier avancé')}
          </button>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar name={profile?.full_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? tr('Utilisateur')}</p>
            <p className="truncate text-xs text-muted-foreground">{role ? roleLabel(role as GarageRole, lang) : tr('Membre')}</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/login') }}
            aria-label={tr('Se déconnecter')}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-muted/20">
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e border-border bg-card lg:block">{Sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-64 bg-card shadow-pop">{Sidebar}</div>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label={tr('Ouvrir le menu')}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold leading-tight">{garage?.name ?? `${brand.shortName} Pro`}</p>
              <p className="text-xs text-muted-foreground">{garage?.city ? `${garage.city} · ` : ''}{tr('Espace garage')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SupabaseStatus className="hidden sm:inline-flex" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4 lg:p-8">
          <Outlet />
          <LegalFooter className="mt-10" />
        </main>
      </div>
    </div>
  )
}
