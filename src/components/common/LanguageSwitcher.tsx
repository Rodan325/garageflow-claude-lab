import { Globe } from 'lucide-react'
import { LANGS, useLang, useT, type Lang } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Minimal language selector (FR / EN / AR). Persists via LanguageProvider
 * (localStorage) and flips document direction for RTL. Intentionally tiny — a
 * native <select> so it works everywhere and adds no layout weight.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  const t = useT()

  return (
    <label className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t.lang.label}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t.lang.label}
        className="cursor-pointer rounded-md border border-input bg-card px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGS.map((code) => (
          <option key={code} value={code}>
            {t.lang[code]}
          </option>
        ))}
      </select>
    </label>
  )
}
