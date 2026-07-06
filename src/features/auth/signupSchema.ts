import { z } from 'zod'
import { passwordIssue } from '@/lib/password'

/**
 * Client sign-up validation. Extracted from SignupPage so the rules
 * (password policy, email/password confirmation, honeypot) are unit-testable.
 * `website` is an invisible honeypot: a real user never fills it, so any value
 * silently blocks the submission (likely a bot).
 */
export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Indiquez votre nom complet'),
    email: z.string().email('Adresse email invalide'),
    emailConfirm: z.string(),
    phone: z.string().optional(),
    password: z.string(),
    passwordConfirm: z.string(),
    website: z.string().optional(), // honeypot — must stay empty
    consent: z.literal(true, { errorMap: () => ({ message: 'Le consentement est requis' }) }),
    legalConsent: z.literal(true, { errorMap: () => ({ message: 'L’acceptation des conditions est requise' }) }),
  })
  .superRefine((d, ctx) => {
    const issue = passwordIssue(d.password, d.email)
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: issue })

    if (d.email.trim().toLowerCase() !== d.emailConfirm.trim().toLowerCase())
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['emailConfirm'], message: 'Les adresses email ne correspondent pas.' })

    if (d.password !== d.passwordConfirm)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirm'], message: 'Les mots de passe ne correspondent pas.' })

    if ((d.website ?? '').trim().length > 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['website'], message: 'Soumission invalide.' })
  })

export type SignupForm = z.infer<typeof signupSchema>
