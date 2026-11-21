import { api } from '@/api'
import type { Api } from '@/api'
import { staffProfileModel } from '../models/staff-profile'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  auth: 'auth',
  login: 'login',
  logout: 'logout',
  refresh: 'refresh',
  users: 'users',
  me: 'me',
  profile: 'profile',
} as const

type Parts = typeof PARTS

// The session's own calls. Every call except `getMe` sets or clears cookies, so it opts out
// of renewal (`auth: false`): a 401 from one of them must not start another renewal.

export function getMe() {
  return api.get(buildEndPoint<Parts>(PREFIX.admin, ['users', 'me', 'profile']), { model: staffProfileModel })
}

export function signIn(body: Api.SuperAdminLoginRequest) {
  return api.post(buildEndPoint<Parts>(PREFIX.admin, ['auth', 'login']), { body, auth: false })
}

export function signOut() {
  return api.post(buildEndPoint<Parts>(PREFIX.admin, ['auth', 'logout']), { auth: false })
}

/** Renews the session cookies. Every expired request waits on it, so it times out instead of hanging. */
export function renewSession() {
  return api.post(buildEndPoint<Parts>(PREFIX.admin, ['auth', 'refresh']), { auth: false, timeout: 10_000 })
}
