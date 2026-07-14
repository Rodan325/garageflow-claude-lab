import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { LegalFooter } from '@/components/common/LegalFooter'
import { legalConfig } from '@/config/legal'
import { useLang } from '@/i18n'

/**
 * Shared shell for the public legal pages (/legal, /privacy, /terms,
 * /pilot-agreement, /dpa). Accessible without login, mobile-first,
 * document-style. All identity values come from legalConfig.
 */
export function LegalLayout({ title, version, children }: { title: string; version?: string; children: React.ReactNode }) {
  const { lang, setLang, tr } = useLang()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center"><Logo /></Link>
          <div className="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {legalConfig.appName} · {tr(legalConfig.pilotVersion)}
          {version ? <> · {tr('Version du document : {version}', { version })}</> : null}
          {' · '}{tr('Dernière mise à jour : {date}', { date: legalConfig.lastUpdated })}
        </p>

        {lang !== 'fr' && (
          <aside className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            <p>{tr('Cette traduction est fournie à titre informatif. En cas de divergence, la version française prévaut.')}</p>
            <button type="button" onClick={() => setLang('fr')} className="mt-2 font-semibold text-primary hover:underline">
              {tr('Version française de référence')}
            </button>
          </aside>
        )}

        <div className="mt-6">{children}</div>

        <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          {tr('Clikarage est proposé en version pilote. Les documents légaux applicables sont accessibles depuis le footer.')}
        </p>
      </main>

      <LegalFooter className="border-t border-border" />
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-8 text-lg font-semibold first:mt-0">{children}</h2>
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export function MailLink({ email }: { email?: string }) {
  const address = email ?? legalConfig.contactEmail
  return <a href={`mailto:${address}`} className="font-medium text-primary hover:underline">{address}</a>
}

export function ExtLink({ href }: { href: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{href}</a>
}
