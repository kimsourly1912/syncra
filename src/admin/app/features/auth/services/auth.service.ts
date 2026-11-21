import { api } from '@/api'
import type { Api } from '@/api'
import { forgotPasswordResultModel } from '../models/forgot-password'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  auth: 'auth',
  forgotPassword: 'forgot-password',
  confirm: 'confirm',
} as const

type Parts = typeof PARTS

// Password reset. Signing in and out belongs to the session feature.

export function forgotPassword(body: Api.SaForgotPasswordRequest) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password'])
  return api.post(endpoint, { body, auth: false, model: forgotPasswordResultModel })
}

/** Sets session cookies on success; the caller reloads the session. */
export function confirmReset(body: Api.SaResetConfirmRequest) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password', 'confirm'])
  return api.post(endpoint, { body, auth: false })
}
