import { createContext, createElement, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { fr, type Messages } from './fr'
import { en } from './en'
import { ar } from './ar'
import { translate } from './catalog'

export type { Messages }

export type Lang = 'fr' | 'en' | 'ar'

/** Supported languages, in display order. `fr` stays the default. */
export const LANGS: Lang[] = ['fr', 'en', 'ar']
export const DEFAULT_LANG: Lang = 'fr'
export const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-MA' }

/** Right-to-left languages — only Arabic for now. */
const RTL_LANGS: Lang[] = ['ar']
export const isRtl = (lang: Lang) => RTL_LANGS.includes(lang)

const dictionaries: Record<Lang, Messages> = { fr, en, ar }

const STORAGE_KEY = 'gf-lang'

function isLang(v: unknown): v is Lang {
  return v === 'fr' || v === 'en' || v === 'ar'
}

/** Read the persisted language, falling back to the default. Safe on SSR/tests. */
export function getStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (isLang(v)) return v
  } catch {
    /* localStorage unavailable — use default */
  }
  if (typeof navigator !== 'undefined') {
    const requested = [...(navigator.languages ?? []), navigator.language]
    for (const locale of requested) {
      const candidate = locale?.toLowerCase().split('-')[0]
      if (isLang(candidate)) return candidate
    }
  }
  return DEFAULT_LANG
}

/** Reflect the active language on <html> (lang + dir) for a11y and RTL layout. */
export function applyDocumentLang(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr'
}

function persistLang(lang: Lang) {
  applyDocumentLang(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* persistence best-effort */
  }
}

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  tr: (source: string, variables?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang())

  // Keep <html lang/dir> and localStorage in sync with the active language.
  useLayoutEffect(() => {
    persistLang(lang)
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    if (!isLang(next)) return
    // Apply direction synchronously so no RTL frame leaks after switching.
    persistLang(next)
    setLangState(next)
  }, [])

  const tr = useCallback((source: string, variables?: Record<string, string | number>) => translate(lang, source, variables), [lang])
  const value = useMemo<LangContextValue>(() => ({ lang, setLang, tr }), [lang, setLang, tr])
  return createElement(LangContext.Provider, { value }, children)
}

/**
 * Current language + setter. Tolerant of a missing provider (returns the default
 * language and a no-op setter) so components stay renderable in isolation/tests.
 */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  return ctx ?? { lang: DEFAULT_LANG, setLang: () => {}, tr: (source, variables) => translate(DEFAULT_LANG, source, variables) }
}

/**
 * Translation accessor: returns the message dictionary for the active language.
 * Usage: `const t = useT(); t.login.title`. Without a provider it yields `fr`,
 * so existing component tests keep their French assertions.
 */
export function useT(): Messages {
  const ctx = useContext(LangContext)
  return dictionaries[ctx?.lang ?? DEFAULT_LANG]
}

/** Non-hook accessor for pure modules (e.g. mapAuthError). */
export function messagesFor(lang: Lang): Messages {
  return dictionaries[lang]
}
