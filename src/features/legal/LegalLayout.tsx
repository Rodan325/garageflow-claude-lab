import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LegalFooter } from '@/components/common/LegalFooter'
import { legalConfig } from '@/config/legal'

/**
 * Shared shell for the public legal pages (/legal, /privacy, /terms,
 * /pilot-agreement, /dpa). Accessible without login, mobile-first,
 * document-style. All identity values come from legalConfig.
 */
export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center"><Logo /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {legalConfig.appName} · {legalConfig.pilotVersion} · Dernière mise à jour : {legalConfig.lastUpdated}
        </p>

        <div className="mt-6">{children}</div>

        <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          Documents préparés pour le pilote, à faire relire par un professionnel du droit avant commercialisation
          large ou engagement contractuel important.
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
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
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
