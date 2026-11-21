import * as v from 'valibot'
import { parseEnvelope } from '@/api'
import type { Api } from '@/api'
import { staffProfileModel } from '@/models/staff-profile'

// Session calls used by the app shell (useAPI, useAuth, the profile plugin), so they
// live outside features (decision 0002). Feature endpoints go in features/<f>/services/.

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  auth: 'auth',
  logout: 'logout',
  refresh: 'refresh',
  me: 'me',
  users: 'users',
  profile: 'profile',
} as const

type Parts = typeof PARTS

export async function getProfile() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['users', 'me', 'profile'])
  const res = await useAPI<Api.ResponseMsgSyncraAdminProfileResponse>(endpoint, { method: 'GET' })
  return parseEnvelope(res, staffProfileModel, `GET ${endpoint}`)
}

// Refresh and logout only matter for their cookies, so their data isn't modelled.
export async function refreshToken() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'refresh'])
  const res = await useRawAPI<Api.ResponseMsgSuperAdminLoginResponse>(endpoint, { method: 'POST' })
  return parseEnvelope(res, v.unknown(), `POST ${endpoint}`)
}

export async function logout() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['auth', 'logout'])
  const res = await useRawAPI<Api.ResponseMsgSuperAdminLogoutResponse>(endpoint, { method: 'POST' })
  return parseEnvelope(res, v.unknown(), `POST ${endpoint}`)
}
