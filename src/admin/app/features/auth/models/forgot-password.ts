import { defineModel, vSaForgotPasswordResponse } from '@/api'

export const forgotPasswordResultModel = defineModel(vSaForgotPasswordResponse, {
  required: ['sent'],
})
