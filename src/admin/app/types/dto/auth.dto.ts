import type { BaseRes } from '@/types/dto/base.dto'

export interface AuthData {
  userStatus: string
  message: string
  pass: boolean
  session: string
  cognitoJWT: CognitoJWT
}

export interface CognitoJWT {
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface SigninReq {
  email: string
  password: string
}

export type SigninData = AuthData

export interface LogoutData {
  success: boolean
}

export interface RefreshTokenData {
  email: string
  expiresInSeconds: number
}

export interface ForgotPasswordReq {
  email: string
}

export interface ForgotPasswordData {
  sent: boolean
}

export interface ConfirmResetData {
  payload: {
    email: string
    expiresInSeconds: number
  }
}

export interface ConfirmResetReq {
  token: string
  newPassword: string
}

export type SigninRes = BaseRes<SigninData>
export type LogoutRes = BaseRes<LogoutData>
export type ConfirmResetRes = BaseRes<ConfirmResetData>
export type RefreshTokenRes = BaseRes<RefreshTokenData>
export type ForgotPasswordRes = BaseRes<ForgotPasswordData>
