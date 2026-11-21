import type { BaseRes } from './base.dto'

export type UserStatus = 'UNCONFIRMED' | 'CONFIRMED'

export interface CognitoJWT {
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

// ------- Data -------
export interface SignInData {
  userStatus: UserStatus | null
  message: string | null
  pass: boolean
  session: string
  cognitoJWT: CognitoJWT
}

export type ForgotEmailData = SignInData
export type ForgotPhoneData = SignInData
export type SignInByEmailData = SignInData
export type SignInByPhoneData = SignInData
export type RefreshTokenData = SignInData
export type SignUpByInvitationConfirmPasswordData = SignInData
export type VerifyEmailOTPData = SignInData

export interface SignUpByInvitationData {
  email: string
  sessionId: string
}

export interface SignUpByEmailData {
  userStatus: UserStatus
  message: string
}

export interface SignUpByPhoneData {
  userStatus: UserStatus
  message: string
}

export type LogoutData = string
// ------- Request -------
export interface SignInByPhoneReq {
  phone: string
  password: string
}

export interface SignInByEmailReq {
  email: string
  password: string
}
export interface SignUpByPhoneReq {
  password: string
  phoneNumber: string
  confirmPassword: string
}

export interface SignUpByEmailReq {
  email: string
  password: string
  confirmPassword: string
}

export interface VerifyPhoneOTPReq {
  code: string
  phoneNumber: string
}

export interface VerifyEmailOTPReq {
  code: string
  email: string
  password: string
}

export interface ForgotEmailReq {
  code: string
  email: string
  newPassword: string
}

export interface ForgotCodeEmailReq {
  email: string
}

export interface ForgotPhoneReq {
  code: string
  phoneNumber: string
  newPassword: string
}

export interface ForgotCodePhoneReq {
  phoneNumber: string
}

export interface SignUpByInvitationReq {
  email: string
  temporaryPassword: string
}

export interface SignUpByInvitationConfirmPasswordReq {
  username: string
  newPassword: string
  session: string
}

export interface ResendOTPByEmailReq {
  email: string
}
export interface ResendOTPByPhoneReq {
  phone: string
}
// ------- Response -------
export type ForgotEmailRes = BaseRes<ForgotEmailData>
export type ForgotPhoneRes = BaseRes<ForgotPhoneData>
export type SignInByPhoneRes = BaseRes<SignInByPhoneData>
export type SignInByEmailRes = BaseRes<SignInByEmailData>
export type RefreshTokenRes = BaseRes<RefreshTokenData>
export type SignUpByInvitationConfirmPasswordRes = BaseRes<SignUpByInvitationConfirmPasswordData>

export type LogoutRes = BaseRes<LogoutData>
export type OAuthGoogleRes = BaseRes<string>
export type OAuthFacebookRes = BaseRes<string>
export type SignUpByPhoneRes = BaseRes<SignUpByPhoneData>
export type SignUpByEmailRes = BaseRes<SignUpByEmailData>
export type VerifyPhoneOTPRes = BaseRes<string>
export type VerifyEmailOTPRes = BaseRes<VerifyEmailOTPData>
export type ForgotCodeEmailRes = BaseRes<string>
export type ForgotCodePhoneRes = BaseRes<string>
export type OAuthAppleRes = BaseRes<string>
export type SignUpByInvitationRes = BaseRes<SignUpByInvitationData>
export type ResendOTPByEmailRes = BaseRes<ResendOTPByEmailReq>
export type ResendOTPByPhoneRes = BaseRes<ResendOTPByPhoneReq>
