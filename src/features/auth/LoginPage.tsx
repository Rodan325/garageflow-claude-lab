import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Network, Smartphone, UserRoundCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Logo } from '@/components/common/Logo'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useToast } from '@/components/ui/toast'
import { useLang, useT } from '@/i18n'
import { useBrand } from '@/branding'
import { mapAuthError } from './authErrors'
import { useAuth } from './AuthProvider'

type Form = { email: string; password: string }

export function LoginPage() {
  const { signIn, enterDemoAccount, ready, session, accountType, isStaff, configured } = useAuth()
  const toast = useToast()
  const t = useT()
  const { lang, tr } = useLang()
  const { brand } = useBrand()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const [submitting, setSubmitting] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const schema = useMemo(() => z.object({
    email: z.string().email(t.validation.emailInvalid),
    password: z.string().min(1, t.validation.passwordRequired),
  }), [t])

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

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

  const goDemo = (account: 'client' | 'independent_garage' | 'network_garage' | 'network_manager') => {
    enterDemoAccount(account)
    navigate(account === 'client' ? '/app' : account === 'network_manager' ? '/pro/network' : '/pro', { replace: true })
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside className="hidden flex-col justify-between border-r border-border bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/"><Logo className="text-white [&_.text-primary]:text-white" /></Link>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold leading-snug">{t.login.asideHeading}</h2>
          <p className="max-w-sm text-sm text-white/80">{brand.official ? t.login.asideSubtitle : tr(brand.loginBranding)}</p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} {brand.companyDisplayName}</p>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex lg:hidden"><Logo /></Link>
            <LanguageSwitcher className="ltr:ml-auto rtl:mr-auto" />
          </div>
          <h1 className="text-2xl font-bold">{t.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.login.subtitle}</p>

          {/* Product presentation accounts — always available. */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <DemoAccountButton icon={Smartphone} label={tr('Client')} detail={tr('Parcours et historique')} onClick={() => goDemo('client')} />
            <DemoAccountButton icon={Building2} label={tr('Garage indépendant')} detail={tr('Pilotage quotidien')} onClick={() => goDemo('independent_garage')} />
            <DemoAccountButton icon={Network} label={tr('Organisation multi-centres')} detail={tr('Activité des établissements')} onClick={() => goDemo('network_garage')} />
            <DemoAccountButton icon={UserRoundCog} label={tr('Responsable réseau')} detail={tr('Comparaison et supervision')} onClick={() => goDemo('network_manager')} />
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t.login.orWithSupabase} <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t.common.email} htmlFor="email" error={errors.email?.message}>
              <Input id="email" dir="ltr" type="email" autoComplete="email" placeholder={t.login.emailPlaceholder} {...register('email')} />
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

function DemoAccountButton({ icon: Icon, label, detail, onClick }: {
  icon: typeof Building2
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <Button variant="outline" onClick={onClick} className="h-auto min-w-0 flex-col gap-1 whitespace-normal py-3 text-center">
      <Icon className="h-5 w-5" />
      <span className="text-sm font-semibold leading-tight">{label}</span>
      <span className="text-[11px] font-normal leading-tight text-muted-foreground">{detail}</span>
    </Button>
  )
}
