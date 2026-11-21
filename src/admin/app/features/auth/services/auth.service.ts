import * as v from 'valibot'
import { parseEnvelope } from '@/api'
import type { Api } from '@/api'
import { forgotPasswordResultModel } from '../models/forgot-password'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  auth: 'auth',
  login: 'login',
  confirm: 'confirm',
  forgotPassword: 'forgot-password',
} as const

type Parts = typeof PARTS

// Sign-in and reset set session cookies; the UI uses nothing from their data.
export async function signIn(body: Api.SuperAdminLoginRequest) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'login'])
  const res = await useRawAPI<Api.ResponseMsgLoginResponseView>(endpoint, { body, method: 'POST' })
  return parseEnvelope(res, v.unknown(), `POST ${endpoint}`)
}

export async function forgotPassword(body: Api.SaForgotPasswordRequest) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password'])
  const res = await useRawAPI<Api.ResponseMsgSaForgotPasswordResponse>(endpoint, { body, method: 'POST' })
  return parseEnvelope(res, forgotPasswordResultModel, `POST ${endpoint}`)
}

export async function confirmReset(body: Api.SaResetConfirmRequest) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password', 'confirm'])
  const res = await useRawAPI<Api.ResponseMsgSuperAdminLoginResult>(endpoint, { body, method: 'POST' })
  return parseEnvelope(res, v.unknown(), `POST ${endpoint}`)
}
