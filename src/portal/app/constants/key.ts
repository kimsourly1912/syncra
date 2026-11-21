import type { ExtractObjectValue } from '@/types/common'

export type CookieKey = ExtractObjectValue<typeof COOKIE>

export const COOKIE = {
  username: 'username',
} as const

export const STATE = {
  token: 'token',
  profile: 'profile',
  password: 'password',
  fromEdit: 'from-edit',
} as const

export const ASYNC_DATA = {
  module: 'module',
  profile: 'profile',
  balanceToken: 'balanceToken',
  contactSale: 'contact-sale',
  subscription: 'subscription',
  representative: 'representative-detail',
  moduleAccess: 'module-access',
  roles: 'roles',
  teamMembers: 'team-members',
  teamSummary: 'team-summary',
} as const

export const STORE_ID = {
  profile: 'profile',
  auth: 'auth',
  permission: 'permission',
  layout: 'layout',
} as const

export const AUTH_STATUS = {
  UNKNOWN: 'unknown',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const

export type AuthStatus = ExtractObjectValue<typeof AUTH_STATUS>
