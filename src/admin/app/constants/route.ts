// Relative on purpose: nuxt.config.ts imports this file, and the `@/` alias doesn't exist there yet.
import type { AcceptLiteral } from '../types/common'
import type { NitroRouteConfig } from 'nitropack/types'

export type IRoutes = RoutePublic | RoutePrivate
export type RoutePublic = (typeof routePublic)[number]
export type RoutePrivate = (typeof routePrivate)[number]
type RouteMap<T extends string> = Record<T, RouteItem<T>>

type RouteRules<T extends string> = {
  [K in T]: NitroRouteConfig
}

interface RouteItem<T> {
  to: T
  title: string
  description: string
  /**
   * indicate multiple pages under a route name
   * like detail, create, read or dynamic page
   */
  multiple: boolean
}

export const routePrivate = ['/auth', '/auth/sign-in', '/auth/forgot', '/auth/reset'] as const
export const routePublic = ['/', '/account', '/lead-inquiry', '/plan-pricing', '/product', '/hero'] as const

export const routePublicMap = {
  '/': {
    multiple: false,
    to: '/',
    title: 'Account Management',
    description: 'Manage company information, workspace, token, seat',
  },
  '/hero': {
    multiple: true,
    to: '/hero',
    title: 'HeroPage Management',
    description: 'Manage hero tagline, description, and video content',
  },
  '/account': {
    multiple: true,
    to: '/account',
    title: 'Account Management',
    description: 'Manage company information, workspace, token, seat',
  },
  '/lead-inquiry': {
    multiple: true,
    to: '/lead-inquiry',
    title: 'Lead Inquiries',
    description: 'Manage and Track incoming leads inquiries',
  },
  '/plan-pricing': {
    multiple: true,
    to: '/plan-pricing',
    title: 'Plan & Pricing Management',
    description: 'Manage Syncra Plan & Pricing',
  },
  '/product': {
    multiple: true,
    to: '/product',
    title: 'Product Management',
    description: 'Manage Syncra Product Listing',
  },
} satisfies RouteMap<AcceptLiteral<RoutePublic>>

export const routePrivateMap = {
  '/auth': {
    to: '/auth',
    title: '',
    description: '',
    multiple: true,
  },
  '/auth/sign-in': {
    to: '/auth/sign-in',
    title: '',
    description: '',
    multiple: false,
  },
  '/auth/forgot': {
    to: '/auth/forgot',
    title: '',
    description: '',
    multiple: false,
  },
  '/auth/reset': {
    to: '/auth/reset',
    title: '',
    description: '',
    multiple: false,
  },
} satisfies RouteMap<AcceptLiteral<RoutePrivate>>

function generateRouteRules<T extends string>(type: 'public' | 'private', value: RouteMap<T>) {
  const res: Record<string, NitroRouteConfig> = {}
  const isPublic = type === 'public'

  for (const key in value) {
    const v = value[key]
    const k = v.multiple ? `${key}/**` : key
    res[k] = {
      appLayout: isPublic ? 'default' : 'auth',
      appMiddleware: isPublic ? 'auth' : 'guest',
    }
  }

  return res as RouteRules<T>
}

export const routeRulesPublic = generateRouteRules('public', routePublicMap)
export const routeRulesPrivate = generateRouteRules('private', routePrivateMap)

export const routeRules = { ...routeRulesPublic, ...routeRulesPrivate }
