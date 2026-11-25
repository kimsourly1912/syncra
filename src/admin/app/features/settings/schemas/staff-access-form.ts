import * as v from 'valibot'
import { vAdminUserGeneralRequest, vCreateSuperAdminUserBody } from '@/api'
import { PASSWORD_RULES } from '@/features/auth'

const { email, tempPassword } = vCreateSuperAdminUserBody.entries

// Inviting a staff member: their email and a temporary password, held to the sign-in policy.
export const staffInviteSchema = v.pipe(
  v.object({
    email: v.pipe(v.nonNullish(email), v.trim(), v.nonEmpty('This field is required'), v.email('Invalid email')),
    tempPassword: v.pipe(
      v.nonNullish(tempPassword),
      v.nonEmpty('This field is required'),
      v.check(password => PASSWORD_RULES.every(rule => v.is(rule.schema, password)), 'Password too weak'),
    ),
    confirmPassword: v.pipe(v.string(), v.nonEmpty('This field is required')),
  }),
  v.forward(
    v.partialCheck(
      [['tempPassword'], ['confirmPassword']],
      input => input.tempPassword === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
)

export type IStaffInviteSchema = v.InferOutput<typeof staffInviteSchema>

// Acting on an existing staff account: the API identifies it by email.
export const staffEmailSchema = v.object({
  email: v.pipe(v.nonNullish(vAdminUserGeneralRequest.entries.email), v.trim(), v.nonEmpty('This field is required'), v.email('Invalid email')),
})

export type IStaffEmailSchema = v.InferOutput<typeof staffEmailSchema>
