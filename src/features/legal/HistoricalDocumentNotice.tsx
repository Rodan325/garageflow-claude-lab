import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'

const copy: Record<Lang, { title: string; body: string; link: string }> = {
  fr: {
    title: 'Archive historique — document non applicable aux nouveaux contrats',
    body: 'Document historique conservé uniquement pour restituer les conditions associées aux acceptations antérieures. Il ne constitue plus le document commercial courant et ne doit pas être accepté par un nouvel utilisateur.',
    link: 'Consulter les conditions actuelles',
  },
  en: {
    title: 'Historical archive — not applicable to new contracts',
    body: 'This version is retained solely to reproduce the terms linked to previous acceptances. It is no longer the current commercial document and must not be accepted by a new user.',
    link: 'View the current terms',
  },
  ar: {
    title: 'أرشيف تاريخي — مستند غير مطبق على العقود الجديدة',
    body: 'يُحتفظ بهذا الإصدار فقط لإظهار الشروط المرتبطة بالموافقات السابقة. ولم يعد المستند التجاري الحالي ولا ينبغي لمستخدم جديد قبوله.',
    link: 'عرض الشروط الحالية',
  },
}

export function HistoricalDocumentNotice({ children }: { children: React.ReactNode }) {
  const { lang } = useLang()
  const message = copy[lang]
  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previous = existing?.content
    const robots = existing ?? document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex,nofollow,noarchive'
    if (!existing) document.head.appendChild(robots)
    return () => {
      if (existing) existing.content = previous ?? ''
      else robots.remove()
    }
  }, [])
  return (
    <div className="bg-background" data-historical-legal-document="true">
      <aside role="note" className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-4 text-amber-900 dark:text-amber-100">
        <div className="mx-auto max-w-3xl text-sm">
          <p className="font-bold">{message.title}</p>
          <p className="mt-1 leading-relaxed">{message.body}</p>
          <Link to="/terms" className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary hover:underline">{message.link}</Link>
        </div>
      </aside>
      {children}
    </div>
  )
}
