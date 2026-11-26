import { defineModel, vSaResetVerifyResponse } from '@/api'

// A reset link the API accepted: the account it resets, when the API names it.
export const resetLinkModel = defineModel(vSaResetVerifyResponse, {
  required: [],
  optional: ['email'],
})
