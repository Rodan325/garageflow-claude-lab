import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Car,
  FileText,
  Gauge,
  Inbox,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { SupabaseStatus } from '@/components/common/SupabaseStatus'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageRequests } from '@/data/requests'
import { ROLE_LABEL, type GarageRole } from '@/types/domain'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/pro', label: 'Tableau de bord', icon: Gauge, end: true },
  { to: '/pro/bookings', label: 'Réservations', icon: Inbox, end: false, badge: true },
  { to: '/pro/calendar', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pro/vehicles', label: 'Véhicules', icon: Car, end: false },
  { to: '/pro/clients', label: 'Clients', icon: Users, end: false },
  { to: '/pro/workshop', label: 'Atelier', icon: Wrench, end: false },
  { to: '/pro/quotes', label: 'Devis', icon: FileText, end: false },
  { to: '/pro/team', label: 'Équipe', icon: Users, end: false },
  { to: '/pro/settings', label: 'Paramètres', icon: Settings, end: false },
]

export function ProShell() {
  const { garage, profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: requests } = useGarageRequests(garage?.id)
  const pending = (requests ?? []).filter((r) => r.status === 'pending').length
  const [open, setOpen] = useState(false)

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && pending > 0 && (
              <span className="rounded-full bg-warning/20 px-1.5 text-xs font-semibold text-warning-foreground">
                {pending}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar name={profile?.full_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? 'Utilisateur'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {role ? ROLE_LABEL[role as GarageRole] : 'Membre'}
            </p>
          </div>
          <button
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
            aria-label="Se déconnecter"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-card shadow-pop">{SidebarContent}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold leading-tight">{garage?.name ?? 'GarageFlow Pro'}</p>
              <p className="text-xs text-muted-foreground">
                {garage?.city ? `${garage.city} · ` : ''}Espace garage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SupabaseStatus className="hidden sm:inline-flex" />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
