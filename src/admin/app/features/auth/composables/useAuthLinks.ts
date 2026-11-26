import { SESSION_PATHS } from '@/features/session'

export const AUTH_PATHS = {
  signIn: SESSION_PATHS.signIn,
  forgot: '/auth/forgot',
} as const

/**
 * Links between the guest pages. They keep `?redirect=`, so signing in after a detour through
 * Forgot password still returns to the page the staff member asked for. `email` carries the
 * address typed so far between the pages, in memory only: never in the URL.
 */
export function useAuthLinks() {
  const route = useRoute()
  const email = useState('auth:email', () => '')
  const query = computed(() => (typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {}))

  return {
    email,
    signIn: computed(() => ({ path: AUTH_PATHS.signIn, query: query.value })),
    forgot: computed(() => ({ path: AUTH_PATHS.forgot, query: query.value })),
  }
}
