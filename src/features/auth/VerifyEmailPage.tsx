import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/common/Logo'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { useLang, useT } from '@/i18n'
import { mapAuthError } from './authErrors'

/**
 * Shown after a signup that requires email confirmation (no session yet).
 * Tells the user to click the link they received, with an optional resend and
 * clear paths back to login / home. Same centered-card style as SignupPage.
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const t = useT()
  const { lang } = useLang()
  const email = (params.get('email') ?? '').trim()
  const [resending, setResending] = useState(false)

  async function resend() {
    if (!email) return
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) toast.error(t.verifyEmail.resendErrorTitle, mapAuthError(error, lang))
    else toast.success(t.verifyEmail.resendOkTitle, t.verifyEmail.resendOkBody)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-7">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex"><Logo /></Link>
          <LanguageSwitcher />
        </div>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">{t.verifyEmail.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.verifyEmail.bodyPrefix}
          {email ? <span className="font-medium text-foreground">{email}</span> : t.verifyEmail.bodyFallbackAddress}
          {t.verifyEmail.bodySuffix}
        </p>

        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={() => navigate('/login')}>{t.verifyEmail.goToLogin}</Button>
          {email && (
            <Button variant="outline" className="w-full" loading={resending} onClick={resend}>
              {t.verifyEmail.resend}
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>{t.verifyEmail.backHome}</Button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {t.verifyEmail.spamHint}
        </p>
      </Card>

      <LegalFooter />
    </div>
  )
}
