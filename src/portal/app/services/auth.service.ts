import type { AuthDTO } from '@/types/dto'

const PREFIX = {
  auth: 'auth',
}

export const PARTS = {
  login: 'login',
  apple: 'apple',
  google: 'google',
  facebook: 'facebook',
  logout: 'logout',
  refresh: 'refresh',
  firstLogin: 'first-login',
  teamMembers: 'team-members',
  loginByEmail: 'login-by-email',
  loginByPhone: 'login-by-phone',
  signUpByEmail: 'sign-up-by-email',
  signUpByPhone: 'sign-up-by-phone',
  confirmEmailSignUp: 'confirm-email-signup',
  confirmPhoneSignUp: 'confirm-phone-signup',
  forceChangePassword: 'force-change-password',
  forgotPasswordChangeByEmail: 'forgot-password-change-by-email',
  forgotPasswordChangeByPhone: 'forgot-password-change-by-phone',
  sendForgotPasswordCodeByEmail: 'send-forgot-password-code-by-email',
  sendForgotPasswordCodeByPhone: 'send-forgot-password-code-by-phone',
  resendOTPByEmail: 'resend-confirm-otp-by-email',
  resendOTPByPhone: 'resend-confirm-otp-by-phone',
} as const

type Parts = typeof PARTS

export function signInByPhone(req: AuthDTO.SignInByPhoneReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['login-by-phone'])
  return useAPI<AuthDTO.SignInByPhoneRes>(endpoint, { body: req, method: 'POST' })
}

export function signInByEmail(req: AuthDTO.SignInByEmailReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['login-by-email'])
  return useAPI<AuthDTO.SignInByEmailRes>(endpoint, { body: req, method: 'POST' })
}

export function resendOTPEmail(req: AuthDTO.ResendOTPByEmailReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['resend-confirm-otp-by-email'])
  return useAPI<AuthDTO.ResendOTPByEmailRes>(endpoint, { body: req, method: 'POST' })
}

export function resendOTPPhone(req: AuthDTO.ResendOTPByPhoneReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['resend-confirm-otp-by-phone'])
  return useAPI<AuthDTO.ResendOTPByPhoneRes>(endpoint, { body: req, method: 'POST' })
}

export function signUpByPhone(req: AuthDTO.SignUpByPhoneReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['sign-up-by-phone'])
  return useAPI<AuthDTO.SignUpByPhoneRes>(endpoint, { body: req, method: 'POST' })
}

export function signUpByEmail(req: AuthDTO.SignUpByEmailReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['sign-up-by-email'])
  return useAPI<AuthDTO.SignUpByEmailRes>(endpoint, { body: req, method: 'POST' })
}

export function verifyPhoneOTP(req: AuthDTO.VerifyPhoneOTPReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['confirm-phone-signup'])
  return useAPI<AuthDTO.VerifyPhoneOTPRes>(endpoint, { body: req, method: 'POST' })
}

export function verifyEmailOTP(req: AuthDTO.VerifyEmailOTPReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['confirm-email-signup'])
  return useAPI<AuthDTO.VerifyEmailOTPRes>(endpoint, { body: req, method: 'POST' })
}

export function forgotEmail(req: AuthDTO.ForgotEmailReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['forgot-password-change-by-email'])
  return useAPI<AuthDTO.ForgotEmailRes>(endpoint, { body: req, method: 'POST' })
}

export function forgotCodeEmail(req: AuthDTO.ForgotCodeEmailReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['send-forgot-password-code-by-email'])
  return useAPI<AuthDTO.ForgotCodeEmailRes>(endpoint, { body: req, method: 'POST' })
}

export function forgotPhone(req: AuthDTO.ForgotPhoneReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['forgot-password-change-by-phone'])
  return useAPI<AuthDTO.ForgotPhoneRes>(endpoint, { body: req, method: 'POST' })
}

export function forgotCodePhone(req: AuthDTO.ForgotCodePhoneReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['send-forgot-password-code-by-phone'])
  return useAPI<AuthDTO.ForgotCodePhoneRes>(endpoint, { body: req, method: 'POST' })
}

export function oAuthGoogle() {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['login', 'google'])
  return useAPI<AuthDTO.OAuthGoogleRes>(endpoint, { method: 'GET' })
}

export function oAuthFacebook() {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['login', 'facebook'])
  return useAPI<AuthDTO.OAuthFacebookRes>(endpoint, { method: 'GET' })
}

export function oAuthApple() {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['login', 'apple'])
  return useAPI<AuthDTO.OAuthAppleRes>(endpoint, { method: 'GET' })
}

export function signUpByInvitation(req: AuthDTO.SignUpByInvitationReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['team-members', 'first-login'])
  return useAPI<AuthDTO.SignUpByInvitationRes>(endpoint, { body: req, method: 'POST' })
}

export function signUpByInvitationConfirmPassword(req: AuthDTO.SignUpByInvitationConfirmPasswordReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['team-members', 'force-change-password'])
  return useAPI<AuthDTO.SignUpByInvitationConfirmPasswordRes>(endpoint, { body: req, method: 'POST' })
}

/**
 * Logout and clear cookies.
 *
 * NOTE: Uses useRawAPI (not useAPI) to bypass the 401 interceptor.
 * If logout fails with 401, we don't want to trigger a refresh attempt.
 */
export function logout() {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['logout'])
  return useRawAPI<AuthDTO.LogoutRes>(endpoint, { method: 'POST' })
}

/**
 * Refresh tokens using HttpOnly cookies.
 * The endpoint reads access_token and refresh_token from cookies.
 *
 * NOTE: Uses useRawAPI (not useAPI) to bypass the 401 interceptor.
 * If refresh fails, we want it to throw directly, not trigger another refresh.
 */
export function refreshTokenByCookie() {
  const endpoint = buildEndPoint<Parts>(PREFIX.auth, ['refresh'])
  return useRawAPI<AuthDTO.RefreshTokenRes>(endpoint, { method: 'POST' })
}
