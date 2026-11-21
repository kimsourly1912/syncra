import * as v from 'valibot'
import { baseSchema, msg } from './base.schema'

export type ISignInSchema = v.InferOutput<typeof signInSchema>
export type IForgotEmailSchema = v.InferOutput<typeof forgotEmailSchema>
export type IChangePasswordSchema = v.InferOutput<typeof changePasswordSchema>

export const signInSchema = v.object({
  email: baseSchema.email,
  password: baseSchema.string,
})

export const forgotEmailSchema = v.object({
  email: baseSchema.email,
})

export const changePasswordSchema = v.pipe(
  v.object({
    newPassword: baseSchema.awsPassword,
    confirmPassword: baseSchema.string,
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      input => input.newPassword === input.confirmPassword,
      msg.notMatch,
    ),
    ['confirmPassword'],
  ),
)
