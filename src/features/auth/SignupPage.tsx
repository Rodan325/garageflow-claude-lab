import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { Logo } from '@/components/common/Logo'
import { useToast } from '@/components/ui/toast'
import { passwordIssue, passwordStrength } from '@/lib/password'
import { useAuth } from './AuthProvider'

const schema = z.object({
  fullName: z.string().min(2, 'Indiquez votre nom complet'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().optional(),
  password: z.string().superRefine((val, ctx) => {
    const issue = passwordIssue(val)
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue })
  }),
  consent: z.literal(true, { errorMap: () => ({ message: 'Le consentement est requis' }) }),
})
type Form = z.infer<typeof schema>

export function SignupPage() {
  const { signUp, ready, session, accountType } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const pw = watch('password') ?? ''
  const strength = passwordStrength(pw)

  useEffect(() => {
    if (done && ready && session && accountType === 'client') navigate(redirect || '/app', { replace: true })
  }, [done, ready, session, accountType, redirect, navigate])

  const onSubmit = async (data: Form) => {
    setSubmitting(true)
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      accountType: 'client',
    })
    setSubmitting(false)
    if (error) {
      toast.error('Création impossible', error)
      return
    }
    toast.success('Compte créé', 'Bienvenue sur GarageFlow.')
    setDone(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
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
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" placeholder="vous@email.fr" {...register('email')} />
          </Field>
          <Field label="Téléphone" htmlFor="phone" hint="Facultatif — utile pour vous joindre au sujet d’un rendez-vous." error={errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" {...register('phone')} />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} required hint="12 caractères minimum — une phrase de passe longue est idéale.">
            <Input id="password" type="password" autoComplete="new-password" placeholder="Une phrase de passe que vous retenez" {...register('password')} />
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

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" {...register('consent')} />
            <span>
              J’accepte que mes données (nom, contact, véhicule) soient utilisées pour traiter mes demandes de
              rendez-vous.{' '}
              {errors.consent && <span className="font-medium text-danger">{errors.consent.message}</span>}
            </span>
          </label>

          <Button type="submit" className="w-full" loading={submitting}>Créer mon compte</Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
        </p>
      </Card>
    </div>
  )
}
