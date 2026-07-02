import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LegalFooter } from '@/components/common/LegalFooter'
import { Button } from '@/components/ui/button'

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  // HashRouter-safe section scroll (never changes the route to a 404).
  // We scroll, then re-align once after in-view animations settle so we land
  // exactly on the section even if layout shifts during the scroll.
  function scrollToSection(id: string) {
    const doScroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(doScroll, 150)
      setTimeout(doScroll, 650)
    } else {
      doScroll()
      setTimeout(doScroll, 500)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <button onClick={() => scrollToSection('problemes')} className="hover:text-foreground">Problèmes</button>
            <button onClick={() => scrollToSection('solution')} className="hover:text-foreground">Solution</button>
            <button onClick={() => scrollToSection('parcours')} className="hover:text-foreground">Parcours</button>
            <Link to="/pilote" className="hover:text-foreground">Offre pilote</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/app" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
              Espace client
            </Link>
            <Button size="sm" onClick={() => navigate('/login')}>
              Espace garage
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo compact />
            <span>© {new Date().getFullYear()} GarageFlow — Démo pilote</span>
          </div>
          <div className="flex gap-5">
            <Link to="/pilote" className="hover:text-foreground">Offre pilote</Link>
            <Link to="/login" className="hover:text-foreground">Connexion garage</Link>
            <Link to="/app" className="hover:text-foreground">Application client</Link>
          </div>
        </div>
        <LegalFooter className="border-t border-border/60" />
      </footer>
    </div>
  )
}
