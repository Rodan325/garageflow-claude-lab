import { Link } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'

const copy: Record<Lang, { title: string; body: string; link: string }> = {
  fr: {
    title: 'Document historique',
    body: 'Cette version est conservée uniquement pour restituer les conditions associées aux acceptations antérieures. Elle ne constitue plus le document commercial courant et ne doit pas être acceptée par un nouvel utilisateur.',
    link: 'Consulter les conditions actuelles',
  },
  en: {
    title: 'Historical document',
    body: 'This version is retained solely to reproduce the terms linked to previous acceptances. It is no longer the current commercial document and must not be accepted by a new user.',
    link: 'View the current terms',
  },
  ar: {
    title: 'مستند تاريخي',
    body: 'يُحتفظ بهذا الإصدار فقط لإظهار الشروط المرتبطة بالموافقات السابقة. ولم يعد المستند التجاري الحالي ولا ينبغي لمستخدم جديد قبوله.',
    link: 'عرض الشروط الحالية',
  },
}

export function HistoricalDocumentNotice({ children }: { children: React.ReactNode }) {
  const { lang } = useLang()
  const message = copy[lang]
  return (
    <div className="bg-background">
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

