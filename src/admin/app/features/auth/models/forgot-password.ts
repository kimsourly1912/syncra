import type * as v from 'valibot'
import { defineModel, vSaForgotPasswordResponse } from '@/api'

export const forgotPasswordResultModel = defineModel(vSaForgotPasswordResponse, {
  required: ['sent'],
})

export type ForgotPasswordResult = v.InferOutput<typeof forgotPasswordResultModel>
