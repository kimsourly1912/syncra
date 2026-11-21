export const SESSION_PATHS = {
  home: '/',
  signIn: '/auth/sign-in',
} as const

/**
 * Where to go after signing in. Only an in-app path is accepted, so a crafted `?redirect=`
 * can't send the user to another site (`//host`, `/\host`) or back to a guest page.
 */
export function redirectTarget(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return SESSION_PATHS.home
  if (value === '/auth' || value.startsWith('/auth/') || value.startsWith('/auth?')) return SESSION_PATHS.home
  return value
}
