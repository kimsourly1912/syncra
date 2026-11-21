import * as v from 'valibot'
import { baseSchema } from './base.schema'

export type ISignUpByInvitationSchema = v.InferOutput<typeof signUpByInvitationSchema>
export type ISignUpByUpdateProfileSchema = v.InferOutput<typeof signUpByInvitationUpdateProfileSchema>
export type ISignUpByInvitationConfirmPasswordSchema = v.InferOutput<typeof signUpByInvitationConfirmPasswordSchema>

export const signUpByInvitationSchema = v.object({
  email: baseSchema.email,
  password: baseSchema.string,
})

export const signUpByInvitationConfirmPasswordSchema = v.pipe(
  v.object({
    password: baseSchema.awsPassword,
    confirmPassword: baseSchema.string,
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      input => input.password === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
)

export const signUpByInvitationUpdateProfileSchema = v.object({
  firstName: baseSchema.string,
  lastName: baseSchema.string,
})
