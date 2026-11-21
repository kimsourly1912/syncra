import type { IRoutes } from '@/constants/route'

export const tw = String.raw
export const IS_DEV = import.meta.dev
export const IS_SERVER = import.meta.server

export function toRoute(path: IRoutes, ...args: string[]) {
  const paths = args.map(o => o.replace(/\//g, '')).join('/')
  const separator = paths.length ? '/' : ''
  return `${path}${separator}${paths}`
}
