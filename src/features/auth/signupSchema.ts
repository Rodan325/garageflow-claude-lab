import { z } from 'zod'
import { passwordIssueCode } from '@/lib/password'
import { fr, type Messages } from '@/i18n/fr'

/**
 * Client sign-up validation. Extracted from SignupPage so the rules
 * (password policy, email/password confirmation, honeypot) are unit-testable.
 * `website` is an invisible honeypot: a real user never fills it, so any value
 * silently blocks the submission (likely a bot).
 */
export function createSignupSchema(messages: Messages['validation']) {
  return z
  .object({
    fullName: z.string().min(2, messages.fullNameRequired),
    email: z.string().email(messages.emailInvalid),
    emailConfirm: z.string(),
    phone: z.string().optional(),
    password: z.string(),
    passwordConfirm: z.string(),
    website: z.string().optional(), // honeypot — must stay empty
    consent: z.literal(true, { errorMap: () => ({ message: messages.consentRequired }) }),
    legalConsent: z.literal(true, { errorMap: () => ({ message: messages.legalConsentRequired }) }),
  })
  .superRefine((d, ctx) => {
    const issue = passwordIssueCode(d.password, d.email)
    const passwordMessages = {
      tooShort: messages.passwordTooShort,
      common: messages.passwordCommon,
      containsEmail: messages.passwordContainsEmail,
      composition: messages.passwordComposition,
    }
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: passwordMessages[issue] })

    if (d.email.trim().toLowerCase() !== d.emailConfirm.trim().toLowerCase())
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['emailConfirm'], message: messages.emailMismatch })

    if (d.password !== d.passwordConfirm)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirm'], message: messages.passwordMismatch })

    if ((d.website ?? '').trim().length > 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['website'], message: messages.invalidSubmission })
  })
}

export const signupSchema = createSignupSchema(fr.validation)

export type SignupForm = z.infer<typeof signupSchema>
