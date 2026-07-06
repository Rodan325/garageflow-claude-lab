import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Logo } from '@/components/common/Logo'
import { LegalFooter } from '@/components/common/LegalFooter'
import { useToast } from '@/components/ui/toast'
import { passwordStrength } from '@/lib/password'
import { legalVersions } from '@/config/legal'
import { recordMultipleLegalAcceptances } from '@/features/legal/legalAcceptance'
import { signupSchema, type SignupForm } from './signupSchema'
import { useAuth } from './AuthProvider'

export function SignupPage() {
  const { signUp, ready, session, accountType } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })
  const pw = watch('password') ?? ''
  const strength = passwordStrength(pw)

  // After a successful signup, record the legal acceptances (terms + privacy,
  // versioned + timestamped) BEFORE entering the app. If recording fails, the
  // LegalAcceptanceGate still blocks the app until acceptance succeeds.
  const recorded = useRef(false)
  useEffect(() => {
    if (!(done && ready && session && accountType === 'client')) return
    if (recorded.current) return
    recorded.current = true
    recordMultipleLegalAcceptances(
      [
        { documentType: 'terms', version: legalVersions.terms },
        { documentType: 'privacy', version: legalVersions.privacy },
      ],
      'client',
      'signup',
    )
      .catch(() => {
        toast.error(
          'Acceptation à confirmer',
          'Votre acceptation des conditions n’a pas pu être enregistrée — elle vous sera redemandée.',
        )
      })
      .finally(() => navigate(redirect || '/app', { replace: true }))
  }, [done, ready, session, accountType, redirect, navigate, toast])

  // Safety net: when Supabase returns a session we normally land in /app via the
  // effect above. If the session never materialises, don't hang on /signup —
  // send the user to /login with a clear message.
  useEffect(() => {
    if (!done || session) return
    const t = setTimeout(() => {
      if (recorded.current) return
      toast.success('Compte créé', 'Connectez-vous pour accéder à votre espace.')
      navigate('/login', { replace: true })
    }, 8000)
    return () => clearTimeout(t)
  }, [done, session, navigate, toast])

  const onSubmit = async (data: SignupForm) => {
    setSubmitting(true)
    const res = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      accountType: 'client',
    })
    setSubmitting(false)
    if (res.error) {
      toast.error('Création impossible', res.error)
      return
    }
    // Email confirmation required → no session yet: route to the verification page.
    if (res.needsEmailConfirmation) {
      navigate(`/verify-email?email=${encodeURIComponent(res.email ?? data.email)}`, { replace: true })
      return
    }
    toast.success('Compte créé', 'Bienvenue sur GarageFlow.')
    setDone(true)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-7">
        <Link to="/" className="mb-6 inline-flex"><Logo /></Link>
        <h1 className="text-2xl font-bold">Créer un compte client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour réserver et suivre vos rendez-vous au garage.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Nom complet" htmlFor="fullName" error={errors.fullName?.message} required>
            <Input id="fullName" autoComplete="name" placeholder="Julie Durand" {...register('fullName')} />
          </Field>
          {/* Honeypot — invisible to humans, tempting to bots. Must stay empty. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Ne pas remplir ce champ</label>
            <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>

          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" placeholder="vous@email.fr" {...register('email')} />
          </Field>
          <Field label="Confirmer l’email" htmlFor="emailConfirm" error={errors.emailConfirm?.message} required>
            <Input id="emailConfirm" type="email" autoComplete="email" placeholder="vous@email.fr" {...register('emailConfirm')} />
          </Field>
          <Field label="Téléphone" htmlFor="phone" hint="Facultatif — utile pour vous joindre au sujet d’un rendez-vous." error={errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" {...register('phone')} />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} required hint="Utilisez au moins 12 caractères. Une phrase de passe longue est idéale.">
            <PasswordInput id="password" autoComplete="new-password" placeholder="Une phrase de passe que vous retenez" {...register('password')} />
          </Field>
          {pw && !errors.password && (
            <div className="flex items-center gap-2 text-xs">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    strength === 'fort' ? 'h-full w-full bg-success'
                    : strength === 'moyen' ? 'h-full w-2/3 bg-warning'
                    : 'h-full w-1/3 bg-danger'
                  }
                />
              </div>
              <span className="text-muted-foreground">
                {strength === 'fort' ? 'Fort' : strength === 'moyen' ? 'Moyen' : 'Faible'}
              </span>
            </div>
          )}
          <Field label="Confirmer le mot de passe" htmlFor="passwordConfirm" error={errors.passwordConfirm?.message} required>
            <PasswordInput id="passwordConfirm" autoComplete="new-password" placeholder="Ressaisissez votre mot de passe" {...register('passwordConfirm')} />
          </Field>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" {...register('consent')} />
            <span>
              J’accepte que mes données (nom, contact, véhicule) soient utilisées pour traiter mes demandes de
              rendez-vous.{' '}
              {errors.consent && <span className="font-medium text-danger">{errors.consent.message}</span>}
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" {...register('legalConsent')} />
            <span>
              J’accepte les{' '}
              <Link to="/terms" target="_blank" className="font-medium text-primary hover:underline">Conditions d’utilisation</Link>{' '}
              (version {legalVersions.terms}) et je reconnais avoir pris connaissance de la{' '}
              <Link to="/privacy" target="_blank" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>{' '}
              (version {legalVersions.privacy}).{' '}
              {errors.legalConsent && <span className="font-medium text-danger">{errors.legalConsent.message}</span>}
            </span>
          </label>

          <Button type="submit" className="w-full" loading={submitting}>Créer mon compte</Button>

          <p className="text-center text-xs text-muted-foreground">
            Votre acceptation est horodatée et conservée dans un journal d’acceptation.
          </p>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
        </p>
      </Card>

      <LegalFooter />
    </div>
  )
}
