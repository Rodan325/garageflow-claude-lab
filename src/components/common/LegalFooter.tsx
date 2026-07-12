import { Link } from 'react-router-dom'
import { legalConfig } from '@/config/legal'
import { useBrand } from '@/branding'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

/**
 * Discreet legal footer, embedded on every surface (landing, login, signup,
 * client space, garage space, public quote page). Renders a <div> so each
 * shell can place it inside its own footer/main without nesting <footer>s.
 */
export function LegalFooter({ className }: { className?: string }) {
  const { brand } = useBrand()
  const t = useT()
  const links = [
    { to: '/legal', label: t.footer.legal },
    { to: '/privacy', label: t.footer.privacy },
    { to: '/terms', label: t.footer.terms },
    { to: '/pilot-agreement', label: t.footer.pilotAgreement },
    { to: '/dpa', label: t.footer.dpa },
  ]
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-[11px] leading-relaxed text-muted-foreground/80',
        className,
      )}
    >
      <span className="font-medium">{brand.official ? t.footer.serviceEditor : brand.legalDisplayName} — {t.footer.pilotVersion}</span>
      {links.map(({ to, label }) => (
        <span key={to} className="inline-flex items-center gap-x-2">
          <span aria-hidden>·</span>
          <Link to={to} className="hover:text-foreground hover:underline">{label}</Link>
        </span>
      ))}
      <span aria-hidden>·</span>
      <a href={`mailto:${legalConfig.contactEmail}`} className="hover:text-foreground hover:underline">{t.footer.contact}</a>
    </div>
  )
}
