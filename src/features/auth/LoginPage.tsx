import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, FlaskConical, Smartphone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Logo } from '@/components/common/Logo'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useToast } from '@/components/ui/toast'
import { useLang, useT } from '@/i18n'
import { mapAuthError } from './authErrors'
import { useAuth } from './AuthProvider'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type Form = z.infer<typeof schema>

export function LoginPage() {
  const { signIn, enterDemo, ready, session, accountType, isStaff, configured } = useAuth()
  const toast = useToast()
  const t = useT()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const [submitting, setSubmitting] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (justLoggedIn && ready && session && accountType) {
      navigate(redirect || (isStaff ? '/pro' : '/app'), { replace: true })
    }
  }, [justLoggedIn, ready, session, accountType, isStaff, redirect, navigate])

  const onSubmit = async (data: Form) => {
    setSubmitting(true)
    const { error } = await signIn(data.email, data.password)
    setSubmitting(false)
    if (error) {
      const low = error.toLowerCase()
      if (low.includes('invalid login credentials') || low.includes('invalid credentials')) {
        // Generic on purpose: never reveal whether the email exists.
        toast.error(t.login.errorTitle, t.login.invalidCredentials)
      } else {
        // Unconfirmed email, network, API-key… → a clear, non-technical message.
        toast.error(t.login.errorTitle, mapAuthError(error, lang))
      }
      return
    }
    setJustLoggedIn(true)
  }

  const fillDemo = (kind: 'garage' | 'client') => {
    setValue('email', kind === 'garage' ? 'owner@demo-garage.fr' : 'client@demo.fr')
    setValue('password', 'Demo1234!')
  }

  const goDemo = (kind: 'garage' | 'client') => {
    enterDemo(kind)
    navigate(kind === 'garage' ? '/pro' : '/app', { replace: true })
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside className="hidden flex-col justify-between border-r border-border bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/"><Logo className="text-white [&_.text-primary]:text-white" /></Link>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold leading-snug">{t.login.asideHeading}</h2>
          <p className="max-w-sm text-sm text-white/80">{t.login.asideSubtitle}</p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} GarageFlow</p>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex lg:hidden"><Logo /></Link>
            <LanguageSwitcher className="ml-auto" />
          </div>
          <h1 className="text-2xl font-bold">{t.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.login.subtitle}</p>

          {!configured && (
            <Card className="mt-5 border-warning/40 bg-warning/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                <FlaskConical className="h-4 w-4" /> Configuration Supabase manquante
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                La connexion réelle nécessite un fichier <code className="rounded bg-black/10 px-1">.env</code>. En attendant,
                explorez l’app en <strong>mode démo local</strong> ci-dessous. (Étapes de config : voir <code>SUPABASE_SETUP.md</code>.)
              </p>
            </Card>
          )}

          {/* Demo entry — always available */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => goDemo('garage')} className="h-auto flex-col gap-1 py-3">
              <Building2 className="h-5 w-5" /> <span className="text-sm font-semibold">{t.login.demoGarage}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{t.login.withoutSupabase}</span>
            </Button>
            <Button variant="outline" onClick={() => goDemo('client')} className="h-auto flex-col gap-1 py-3">
              <Smartphone className="h-5 w-5" /> <span className="text-sm font-semibold">{t.login.demoClient}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{t.login.withoutSupabase}</span>
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t.login.orWithSupabase} <span className="h-px flex-1 bg-border" />
          </div>

          {configured && (
            <div className="mb-3 flex gap-2 text-xs">
              <button type="button" onClick={() => fillDemo('garage')} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 hover:bg-muted/60">
                <Building2 className="h-3.5 w-3.5" /> {t.login.prefillGarage}
              </button>
              <button type="button" onClick={() => fillDemo('client')} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 hover:bg-muted/60">
                <User className="h-3.5 w-3.5" /> {t.login.prefillClient}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t.common.email} htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" placeholder={t.login.emailPlaceholder} {...register('email')} />
            </Field>
            <Field label={t.common.password} htmlFor="password" error={errors.password?.message}>
              <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
            </Field>
            <Button type="submit" className="w-full" loading={submitting} disabled={!configured}>
              {t.login.submit}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.login.noAccount}{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">{t.login.createAccountLink}</Link>
          </p>

          <LegalFooter className="mt-6 px-0" />
        </div>
      </div>
    </div>
  )
}
