import type { AuthDTO } from '@/types/dto'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  auth: 'auth',
  login: 'login',
  logout: 'logout',
  refresh: 'refresh',
  confirm: 'confirm',
  forgotPassword: 'forgot-password',
} as const

type Parts = typeof PARTS

export function signin(req: AuthDTO.SigninReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'login'])
  return useRawAPI<AuthDTO.SigninRes>(endpoint, { body: req, method: 'POST' })
}

export function logout() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'logout'])
  return useRawAPI<AuthDTO.LogoutRes>(endpoint, { method: 'POST' })
}

export function forgotPassword(req: AuthDTO.ForgotPasswordReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password'])
  return useRawAPI<AuthDTO.ForgotPasswordRes>(endpoint, { body: req, method: 'POST' })
}

export function refreshToken() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'refresh'])
  return useRawAPI<AuthDTO.RefreshTokenRes>(endpoint, { method: 'POST' })
}

export function confirmReset(req: AuthDTO.ConfirmResetReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'forgot-password', 'confirm'])
  return useRawAPI<AuthDTO.ConfirmResetRes>(endpoint, { body: req, method: 'POST' })
}
