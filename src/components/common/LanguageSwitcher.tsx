import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGS, useLang, type Lang } from '@/i18n'
import { cn } from '@/lib/utils'

const selfNames: Record<Lang, string> = { fr: 'Français', en: 'English', ar: 'العربية' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, tr } = useLang()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus()
      }
      if (event instanceof MouseEvent && !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('mousedown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('mousedown', close)
    }
  }, [open])

  return (
    <div ref={root} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={tr('Langue active : {language}', { language: selfNames[lang] })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{lang.toUpperCase()}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={tr('Changer de langue')}
          className="absolute end-0 top-full z-50 mt-2 min-w-40 rounded-xl border border-border bg-card p-1.5 shadow-pop"
        >
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === code}
              lang={code}
              dir={code === 'ar' ? 'rtl' : 'ltr'}
              onClick={() => { setLang(code); setOpen(false) }}
              className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-start text-sm hover:bg-muted"
            >
              <span>{selfNames[code]}</span>
              {lang === code && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
