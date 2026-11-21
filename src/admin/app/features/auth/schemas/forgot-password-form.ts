import * as v from 'valibot'
import { vSaForgotPasswordRequest } from '@/api'

export const forgotPasswordSchema = v.object({
  email: v.pipe(v.nonNullish(vSaForgotPasswordRequest.entries.email), v.nonEmpty('This field is required'), v.email('Invalid email')),
})

export type IForgotPasswordSchema = v.InferOutput<typeof forgotPasswordSchema>
