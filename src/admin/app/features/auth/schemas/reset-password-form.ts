import * as v from 'valibot'
import { vSaResetConfirmRequest } from '@/api'

/** The password policy, one rule per hint shown under the field. */
const PASSWORD_RULES = [
  { text: 'No spaces', schema: v.pipe(v.string(), v.regex(/^\S+$/)) },
  { text: 'Contains at least 8 characters', schema: v.pipe(v.string(), v.minLength(8)) },
  { text: 'Contains both lower (a-z) and upper case letters (A-Z)', schema: v.pipe(v.string(), v.regex(/[a-z]/), v.regex(/[A-Z]/)) },
  { text: 'Contains both number (0-9) and symbol', schema: v.pipe(v.string(), v.regex(/\d/), v.regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)) },
]

/** Which password rules `password` meets, for the live checklist. */
export function checkPasswordRules(password: string) {
  return PASSWORD_RULES.map(rule => ({ text: rule.text, valid: v.is(rule.schema, password) }))
}

// The token comes from the reset link, so the form holds only the new password and its confirmation.
export const resetPasswordSchema = v.pipe(
  v.object({
    newPassword: v.pipe(
      v.nonNullish(vSaResetConfirmRequest.entries.newPassword),
      v.nonEmpty('This field is required'),
      v.check(password => PASSWORD_RULES.every(rule => v.is(rule.schema, password)), 'Password too weak'),
    ),
    confirmPassword: v.pipe(v.string(), v.nonEmpty('This field is required')),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      input => input.newPassword === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
)

export type IResetPasswordSchema = v.InferOutput<typeof resetPasswordSchema>
