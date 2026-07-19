import { Link } from 'react-router-dom'
import { legalConfig } from '@/config/legal'
import { useBrand } from '@/branding'
import { cn } from '@/lib/utils'
import { useLang, useT } from '@/i18n'
import type { Brand } from '@/branding'
import { legalDocsV2Enabled, subprocessorRegistryEnabled } from '@/lib/features'

/**
 * Discreet legal footer, embedded on every surface (landing, login, signup,
 * client space, garage space, public quote page). Renders a <div> so each
 * shell can place it inside its own footer/main without nesting <footer>s.
 */
export function LegalFooter({ className, brandOverride }: { className?: string; brandOverride?: Brand }) {
  const { brand } = useBrand()
  const displayedBrand = brandOverride ?? brand
  const t = useT()
  const { tr } = useLang()
  const links = legalDocsV2Enabled() ? [
    { to: '/legal', label: t.footer.legal },
    { to: '/privacy', label: t.footer.privacy },
    { to: '/terms/client', label: t.footer.terms },
    { to: '/cookies', label: tr('Cookies et traceurs') },
    ...(subprocessorRegistryEnabled() ? [{ to: '/subprocessors', label: tr('Prestataires') }] : []),
  ] : [
    { to: '/legal', label: t.footer.legal },
    { to: '/privacy', label: t.footer.privacy },
    { to: '/terms', label: t.footer.terms },
    { to: '/dpa', label: t.footer.dpa },
  ]
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-[11px] leading-relaxed text-muted-foreground/80',
        className,
      )}
    >
      <span className="font-medium">{displayedBrand.official ? t.footer.serviceEditor : tr(displayedBrand.legalDisplayName)} — {t.footer.serviceAvailability}</span>
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
