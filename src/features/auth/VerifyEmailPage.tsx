import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/common/Logo'
import { LegalFooter } from '@/components/common/LegalFooter'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
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
  const email = (params.get('email') ?? '').trim()
  const [resending, setResending] = useState(false)

  async function resend() {
    if (!email) return
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) toast.error('Envoi impossible', mapAuthError(error))
    else toast.success('Email renvoyé', 'Vérifiez votre boîte de réception (et le dossier spam).')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-7">
        <Link to="/" className="mb-6 inline-flex"><Logo /></Link>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Vérifiez votre email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Nous avons envoyé un lien de confirmation à :{' '}
          {email ? <span className="font-medium text-foreground">{email}</span> : 'votre adresse email'}. Cliquez sur le
          lien reçu pour activer votre compte, puis connectez-vous.
        </p>

        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={() => navigate('/login')}>Aller à la connexion</Button>
          {email && (
            <Button variant="outline" className="w-full" loading={resending} onClick={resend}>
              Renvoyer l’email
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>Retour à l’accueil</Button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Vous ne trouvez pas l’email ? Pensez à vérifier votre dossier spam.
        </p>
      </Card>

      <LegalFooter />
    </div>
  )
}
