import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/common/Logo'
import { useLang } from '@/i18n'

export function NotFoundPage() {
  const { tr } = useLang()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <Logo />
      <p className="text-5xl font-black">404</p>
      <p className="max-w-sm text-muted-foreground">{tr('Cette page n’existe pas ou a été déplacée.')}</p>
      <div className="flex gap-2">
        <Link to="/"><Button variant="outline">{tr('Accueil')}</Button></Link>
        <Link to="/app"><Button>{tr('Application client')}</Button></Link>
      </div>
    </div>
  )
}
