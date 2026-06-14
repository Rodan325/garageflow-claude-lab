import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarCheck, Home, ListChecks, User } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/app', label: 'Accueil', icon: Home, end: true },
  { to: '/app/book', label: 'Réserver', icon: CalendarCheck, end: false },
  { to: '/app/bookings', label: 'Demandes', icon: ListChecks, end: false },
  { to: '/app/profile', label: 'Profil', icon: User, end: false },
]

/**
 * Client shell — the layout follows the VIEWPORT, not the route.
 * - Mobile: full-screen app with a fixed bottom navigation (Maat-style).
 * - Desktop: a real, wider web layout with a top navigation (Doctolib-style).
 *   No phone frame here — the phone mockup only lives on the landing page.
 */
export function ClientShell() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/90 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <button onClick={() => navigate('/app')} className="flex items-center"><Logo /></button>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <ThemeToggle className="ml-1" />
          </nav>
        </div>
      </header>

      {/* Mobile top header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => navigate('/app')} className="flex items-center"><Logo /></button>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 pb-24 lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
