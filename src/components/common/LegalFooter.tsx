import { Link } from 'react-router-dom'
import { legalConfig } from '@/config/legal'
import { useBrand } from '@/branding'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/legal', label: 'Mentions légales' },
  { to: '/privacy', label: 'Confidentialité' },
  { to: '/terms', label: 'CGU' },
  { to: '/pilot-agreement', label: 'Contrat pilote' },
  { to: '/dpa', label: 'DPA' },
]

/**
 * Discreet legal footer, embedded on every surface (landing, login, signup,
 * client space, garage space, public quote page). Renders a <div> so each
 * shell can place it inside its own footer/main without nesting <footer>s.
 */
export function LegalFooter({ className }: { className?: string }) {
  const { brand } = useBrand()
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-[11px] leading-relaxed text-muted-foreground/80',
        className,
      )}
    >
      <span className="font-medium">{brand.legalDisplayName} — {legalConfig.pilotVersion}</span>
      {LINKS.map(({ to, label }) => (
        <span key={to} className="inline-flex items-center gap-x-2">
          <span aria-hidden>·</span>
          <Link to={to} className="hover:text-foreground hover:underline">{label}</Link>
        </span>
      ))}
      <span aria-hidden>·</span>
      <a href={`mailto:${legalConfig.contactEmail}`} className="hover:text-foreground hover:underline">Contact</a>
    </div>
  )
}
