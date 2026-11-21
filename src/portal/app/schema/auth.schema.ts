import * as v from 'valibot'
import { baseSchema } from './base.schema'

export type ISignInEmailSchema = v.InferOutput<typeof signInEmailSchema>
export type ISignInPhoneSchema = v.InferOutput<typeof signInPhoneSchema>

export type ISignUpOtpSchema = v.InferOutput<typeof signUpOtpSchema>
export type ISignUpEmailSchema = v.InferOutput<typeof signUpEmailSchema>
export type ISignUpPhoneSchema = v.InferOutput<typeof signUpPhoneSchema>

export type IForgotPasswordSchema = v.InferOutput<typeof forgotPasswordSchema>
export type IForgotPhoneSchema = v.InferOutput<typeof forgotPhoneSchema>
export type IForgotEmailSchema = v.InferOutput<typeof forgotEmailSchema>
export type IForgotOtpSchema = v.InferOutput<typeof forgotOtpSchema>

const msg = {
  notMatch: 'Passwords do not match.',
}

export const authSchema = {
  code: baseSchema.string,
  email: baseSchema.email,
  phone: baseSchema.phone,
  password: baseSchema.string,
  otp: baseSchema.otp,
  awsPassword: baseSchema.awsPassword,
  confirmPassword: baseSchema.string,
}

export const signInEmailSchema = v.object({
  email: authSchema.email,
  password: authSchema.password,
})

export const signInPhoneSchema = v.object({
  phone: authSchema.phone,
  code: authSchema.code,
  password: authSchema.password,
  // confirmPassword: authSchema.password,
})

export const signUpEmailSchema = v.pipe(
  v.object({
    email: authSchema.email,
    password: authSchema.awsPassword,
    confirmPassword: authSchema.confirmPassword,
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      input => input.password === input.confirmPassword,
      msg.notMatch,
    ),
    ['confirmPassword'],
  ),
)

export const signUpPhoneSchema = v.pipe(
  v.object({
    phone: authSchema.phone,
    code: authSchema.code,
    password: authSchema.awsPassword,
    confirmPassword: authSchema.confirmPassword,
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      input => input.password === input.confirmPassword,
      msg.notMatch,
    ),
    ['confirmPassword'],
  ),
)

export const signUpOtpSchema = v.object({
  otp: authSchema.otp,
})

export const forgotEmailSchema = v.object({
  email: authSchema.email,
})

export const forgotPhoneSchema = v.object({
  phone: authSchema.phone,
  code: authSchema.code,
})

export const forgotPasswordSchema = v.pipe(
  v.object({
    newPassword: authSchema.awsPassword,
    confirmPassword: authSchema.confirmPassword,
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

export const forgotOtpSchema = v.object({
  otp: authSchema.otp,
})
