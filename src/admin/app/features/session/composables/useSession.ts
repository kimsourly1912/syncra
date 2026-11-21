import { ApiError } from '@/api'
import type { Api } from '@/api'
import type { StaffProfile } from '../models/staff-profile'
import * as sessionService from '../services/session.service'
import { SESSION_PATHS } from '../utils/paths'

export type SessionStatus = 'unknown' | 'signed-in' | 'signed-out'
export type SessionEvent = 'signed-in' | 'signed-out'

const STATE = {
  status: 'session:status',
  staff: 'session:staff',
} as const

// One profile load at a time, shared by the route guard and the actions.
let loading: Promise<void> | undefined
// Tells the other tabs; set by useSessionSync.
let announce: ((event: SessionEvent) => void) | undefined

export function setSessionAnnouncer(fn: typeof announce) {
  announce = fn
}

/**
 * The signed-in staff member. `status` starts `unknown`; the route guard calls `load()` on the
 * first navigation. The API client calls `end('expired')` when the session can't be renewed.
 * Staff access is enforced by the API: this state only decides navigation.
 */
export function useSession() {
  const status = useState<SessionStatus>(STATE.status, () => 'unknown')
  const staff = useState<StaffProfile | null>(STATE.staff, () => null)
  const router = useRouter()
  const toast = useToast()
  const signedIn = computed(() => status.value === 'signed-in')

  function clear() {
    status.value = 'signed-out'
    staff.value = null
    // Clear any other state tied to the staff session here too.
  }

  /** Loads the profile once. A profile that can't be loaded, for any reason, means signed out. */
  function load() {
    if (status.value !== 'unknown') return Promise.resolve()
    loading ??= sessionService.getMe()
      .then((profile) => {
        staff.value = profile
        status.value = 'signed-in'
      })
      .catch((error: unknown) => {
        const e = ApiError.from(error)
        if (e.kind !== 'unauthorized') console.error('Could not load the staff profile', e)
        clear()
      })
      .finally(() => {
        loading = undefined
      })
    return loading
  }

  /** Loads the profile again, for example after the cookies changed. */
  async function reload() {
    await loading
    status.value = 'unknown'
    await load()
  }

  /** Throws `ApiError` if the API refuses the credentials or the profile can't be loaded. */
  async function signIn(body: Api.SuperAdminLoginRequest) {
    await sessionService.signIn(body)
    await reload()
    if (!signedIn.value) throw new ApiError({ kind: 'unknown', message: 'Signed in, but your profile could not be loaded. Please try again.' })
    announce?.('signed-in')
  }

  /** Throws `ApiError` if the API didn't confirm the logout; the session is then kept. */
  async function signOut() {
    await sessionService.signOut()
    clear()
    announce?.('signed-out')
    await router.push(SESSION_PATHS.signIn)
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
    void router.push({ path: SESSION_PATHS.signIn, query: { redirect: router.currentRoute.value.fullPath } })
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
