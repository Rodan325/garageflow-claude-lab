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
 * Mobile-first client shell.
 * - Phones: full-screen app (viewport decides).
 * - Desktop: a centered "phone mockup" on a branded backdrop — never a broken
 *   narrow column. The bottom nav stays in normal flow (no fixed overlay).
 */
export function ClientShell() {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-background lg:flex lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-muted/60 lg:to-accent/40 lg:p-6">
      <div className="hidden max-w-xs pr-10 lg:block">
        <Logo className="text-lg" />
        <h2 className="mt-4 text-2xl font-bold leading-tight">L’app client GarageFlow</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Réservez, suivez vos demandes et gérez vos véhicules depuis votre téléphone. Aperçu interactif à droite.
        </p>
      </div>

      <div
        className={cn(
          'relative mx-auto flex w-full flex-col overflow-hidden bg-background',
          'min-h-dvh',
          // desktop phone frame
          'lg:mx-0 lg:h-[844px] lg:min-h-0 lg:w-[400px] lg:rounded-[2.2rem] lg:border-[6px] lg:border-foreground/10 lg:shadow-pop',
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
          <button onClick={() => navigate('/app')} className="flex items-center">
            <Logo />
          </button>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        <nav className="z-20 shrink-0 border-t border-border bg-background/95 backdrop-blur">
          <div className="grid grid-cols-4 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2">
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
    </div>
  )
}
