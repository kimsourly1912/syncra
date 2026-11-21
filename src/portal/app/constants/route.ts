import type { ExtractObjectValue } from '@/types/common'

export type IRoute = ExtractObjectValue<typeof ROUTE_PRIVATE | typeof ROUTE_PUBLIC>

export const ROUTES = [
  'auth',
  'create',
  'invite',
  'sign-in',
  'sign-up',
  'workspace',
  'settings',
  'onboarding',
  'application',
  'activity-log',
  'account-profile',
  'activity-history',
  'glossary',
  'forgot-password',
  'verify',
  'company-information',
  'token',
] as const

export const ROUTE_PRIVATE = {
  application: '/',
  activityLog: '/activity-log',
  settings: {
    index: '/settings',
    accountProfile: '/settings/account-profile',
    companyInformation: '/settings/company-information',
  },
  workspace: {
    index: '/workspace',
    create: '/workspace/create',
    activityHistory: '/workspace/activity-history',
    glossary: '/workspace/glossary',
  },
  learnMore: '/learn-more',
  onboarding: '/onboarding',
  teamManagement: '/team-management',
  bookkeeping: '/bookkeeping',
  token: '/token',
} as const

export const ROUTE_SUB_PRIVATE = {
  create: '/create',
  edit: '/edit',
  delete: '/delete',
  view: '/view',
} as const

export const ROUTE_PUBLIC = {
  auth: {
    signIn: '/auth/sign-in',
    invite: '/auth/invite',
    signUp: '/auth/sign-up',
    verify: '/auth/verify',
    forgotPassword: '/auth/forgot-password',
  },
  policy: {
    terms: '/policy/terms',
    privatecy: '/policy/privacy',
    facebookDataDeletion: '/policy/facebook-data-deletion',
  },
} as const

export function getPathValue<T>(obj: T): string[] {
  const values: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractValues(currentObj: any) {
    for (const key in currentObj) {
      if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
        // Recursively process nested objects
        extractValues(currentObj[key])
      }
      else {
        // Add leaf values (strings, numbers, etc.)
        values.push(String(currentObj[key]))
      }
    }
  }

  extractValues(obj)
  return values
}

export const privatePathValue = getPathValue(ROUTE_PRIVATE)
export const publicPathValue = getPathValue(ROUTE_PUBLIC)
