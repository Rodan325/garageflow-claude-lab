import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LegalFooter } from '@/components/common/LegalFooter'
import { Button } from '@/components/ui/button'
import { useBrand } from '@/branding'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useT } from '@/i18n'

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand } = useBrand()
  const t = useT()

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
        <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <button onClick={() => scrollToSection('problemes')} className="hover:text-foreground">{t.nav.problems}</button>
            <button onClick={() => scrollToSection('solution')} className="hover:text-foreground">{t.nav.solution}</button>
            <button onClick={() => scrollToSection('parcours')} className="hover:text-foreground">{t.nav.journey}</button>
            <Link to="/pilote" className="hover:text-foreground">{t.nav.pilotOffer}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="[&_svg]:hidden sm:[&_svg]:block [&_select]:px-1 sm:[&_select]:px-2" />
            <span className="hidden sm:inline-flex"><ThemeToggle /></span>
            <Button size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" onClick={() => navigate('/login')}>
              {t.nav.accessAccount}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo compact />
            <span>© {new Date().getFullYear()} {brand.companyDisplayName} — {t.footer.pilotDemo}</span>
          </div>
          <div className="flex gap-5">
            <Link to="/pilote" className="hover:text-foreground">{t.nav.pilotOffer}</Link>
            <Link to="/login" className="hover:text-foreground">{t.nav.accessAccount}</Link>
          </div>
        </div>
        <LegalFooter className="border-t border-border/60" />
      </footer>
    </div>
  )
}
