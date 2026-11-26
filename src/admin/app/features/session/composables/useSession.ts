import { api, ApiError } from '@/api'
import type { Api, ApiErrorKind } from '@/api'
import { staffProfileModel } from '../models/staff-profile'
import type { StaffProfile } from '../models/staff-profile'
import { SESSION_PATHS } from '../utils/paths'

export type SessionStatus = 'unknown' | 'signed-in' | 'signed-out'
export type SessionEvent = 'signed-in' | 'signed-out'

const STATE = {
  status: 'session:status',
  staff: 'session:staff',
} as const

/**
 * A profile request that failed with these means there's no usable staff session. Any other
 * failure (offline, timeout, 5xx, an unexpected response) says nothing about the session, so
 * the session isn't changed.
 */
const NO_SESSION = new Set<ApiErrorKind>(['unauthorized', 'forbidden', 'rejected', 'validation', 'not_found'])

// One profile request at a time, shared by the route guard and the actions.
let loading: Promise<ApiError | undefined> | undefined
// Goes up each time the session is cleared, so a profile response that was already in flight
// can't sign this tab back in (another tab signed out while it loaded).
let generation = 0
// Tells the other tabs; set by useSessionSync.
let announce: ((event: SessionEvent) => void) | undefined

export function setSessionAnnouncer(fn: typeof announce) {
  announce = fn
}

/**
 * Renews the session cookies; the API client calls it on a 401. Every expired request waits on
 * it, so it times out instead of hanging. `auth: false`: its own 401 must not start a renewal.
 */
export function renewSession() {
  return api.post('/admin/auth/refresh', { auth: false, timeout: 10_000 })
}

/**
 * The signed-in staff member. `status` starts `unknown`; the route guard calls `load()` on the
 * first navigation. The API client calls `end('expired')` when the session can't be renewed.
 * Staff access is enforced by the API: this state only decides navigation.
 */
export function useSession() {
  const status = useState<SessionStatus>(STATE.status, () => 'unknown')
  const staff = useState<StaffProfile | null>(STATE.staff, () => null)
  const nuxtApp = useNuxtApp()
  const router = useRouter()
  const toast = useToast()
  const signedIn = computed(() => status.value === 'signed-in')

  function clear() {
    generation++
    status.value = 'signed-out'
    staff.value = null
  }

  /** Drops every query's data, so the next staff member in this tab never sees it. Call once the signed-out page is showing. */
  function forgetData() {
    nuxtApp.runWithContext(() => clearNuxtData())
  }

  /**
   * Requests the profile; concurrent callers share the request. Resolves to the failure when the
   * API couldn't answer (the session is then left as it was), otherwise to `undefined`.
   */
  function fetchProfile() {
    const started = generation
    loading ??= api.get('/admin/users/me/profile', { model: staffProfileModel })
      .then((profile) => {
        if (started !== generation) return undefined
        staff.value = profile
        status.value = 'signed-in'
        return undefined
      })
      .catch((error: unknown) => {
        const e = ApiError.from(error)
        if (NO_SESSION.has(e.kind)) {
          clear()
          return undefined
        }
        reportAppError(e, { source: 'GET /admin/users/me/profile', message: 'Could not load the staff profile' })
        return e
      })
      .finally(() => {
        loading = undefined
      })
    return loading
  }

  /**
   * Loads the profile once. Resolves to the failure if the API couldn't answer: `status` then
   * stays `unknown`, so the next call tries again. A cookie that's still valid never signs anyone
   * out just because the API was briefly unreachable.
   */
  async function load() {
    if (status.value !== 'unknown') return undefined
    return fetchProfile()
  }

  /** Loads the profile again, for example after the cookies changed. A failure keeps the current state. */
  async function reload() {
    await loading
    return fetchProfile()
  }

  /** Throws `ApiError` if the API refuses the credentials or the profile can't be loaded. */
  async function signIn(body: Api.SuperAdminLoginRequest) {
    // Sets the session cookies; `auth: false` so a refused login isn't treated as an expiry.
    await api.post('/admin/auth/login', { body, auth: false })
    const failure = await reload()
    if (failure || !signedIn.value) {
      throw new ApiError({ kind: failure?.kind ?? 'unknown', message: 'Signed in, but your profile could not be loaded. Please try again.', cause: failure })
    }
    announce?.('signed-in')
  }

  /**
   * Throws `ApiError` if the API didn't confirm the logout; the session is then kept. The logout
   * renews an expired access token first, so a staff member who was idle can still sign out (and
   * the refresh cookie is cleared). If the session couldn't be renewed, it was already over:
   * `end('expired')` has signed this tab out, and the other tabs are told too.
   */
  async function signOut() {
    try {
      await api.post('/admin/auth/logout')
    }
    catch (error) {
      if (ApiError.from(error).kind !== 'unauthorized') throw error
    }
    clear()
    announce?.('signed-out')
    await router.push(SESSION_PATHS.signIn)
    forgetData()
  }

  /**
   * Ends the session locally: it expired, or another tab signed out. Every failed request
   * reports an expiry, so only the first call acts. Before the first load there's no page to
   * leave, and the route guard redirects by itself.
   */
  function end(reason: 'expired' | 'signed-out-elsewhere') {
    if (status.value === 'signed-out') return
    const wasSignedIn = status.value === 'signed-in'
    clear()
    if (!wasSignedIn) return
    if (reason === 'expired') toast.add({ title: 'Session expired', description: 'Please sign in again.', color: 'warning' })
    void router.push({ path: SESSION_PATHS.signIn, query: { redirect: router.currentRoute.value.fullPath } }).finally(forgetData)
  }

  return {
    status: readonly(status),
    staff: readonly(staff),
    signedIn,
    load,
    reload,
    signIn,
    signOut,
    end,
  }
}
