import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { LegalFooter } from '@/components/common/LegalFooter'
import { legalConfig } from '@/config/legal'
import { useLang, type Lang } from '@/i18n'

const translationNotice: Record<Exclude<Lang, 'fr'>, string> = {
  en: 'This translation is provided for information purposes. In the event of a discrepancy, the French version prevails.',
  ar: 'تُقدَّم هذه الترجمة لأغراض إعلامية. وفي حال وجود اختلاف، تكون النسخة الفرنسية هي المرجع.',
}

const referenceLabel: Record<Exclude<Lang, 'fr'>, string> = {
  en: 'Open the reference French version',
  ar: 'فتح النسخة الفرنسية المرجعية',
}

const footerNote: Record<Lang, string> = {
  fr: 'Clikarage est un service édité par RODANBTECH. Les documents applicables sont accessibles depuis le pied de page.',
  en: 'Clikarage is a service published by RODANBTECH. Applicable documents are available from the footer.',
  ar: 'Clikarage خدمة تنشرها RODANBTECH. ويمكن الوصول إلى المستندات المطبقة من تذييل الصفحة.',
}

export function CommercialLegalLayout({
  title,
  version,
  children,
}: {
  title: string
  version: string
  children: React.ReactNode
}) {
  const { lang, setLang } = useLang()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center"><Logo /></Link>
          <div className="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {legalConfig.appName} · {lang === 'ar' ? 'إصدار المستند' : lang === 'en' ? 'Document version' : 'Version du document'}:
          {' '}<bdi dir="ltr">{version}</bdi>
        </p>

        {lang !== 'fr' && (
          <aside className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            <p>{translationNotice[lang]}</p>
            <button type="button" onClick={() => setLang('fr')} className="mt-2 min-h-10 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {referenceLabel[lang]}
            </button>
          </aside>
        )}

        <div className="mt-6">{children}</div>

        <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">{footerNote[lang]}</p>
      </main>

      <LegalFooter className="border-t border-border" />
    </div>
  )
}

export function LegalSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-8 text-lg font-semibold leading-snug first:mt-0">{children}</h2>
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-7 text-muted-foreground">{children}</p>
}

