import { api } from '@/api'
import type { ApiErrorKind } from '@/api'
import type { IResetPasswordSchema } from '../schemas/reset-password-form'
import { resetLinkModel } from '../models/reset-link'
import { useSession } from '@/features/session'

/**
 * - `checking`: the link is being verified.
 * - `ready`: the API accepted the link; show the form.
 * - `invalid`: no token, or the API refused it (expired, already used, unknown).
 * - `unavailable`: the API couldn't answer (offline, 5xx, an unexpected response); retry.
 * - `done`: the password was changed.
 */
export type ResetLinkState = 'checking' | 'ready' | 'invalid' | 'unavailable' | 'done'

/** Failures that mean the API looked at the token and refused it. Anything else says nothing about the link. */
const REFUSED = new Set<ApiErrorKind>(['rejected', 'validation', 'not_found', 'forbidden', 'unauthorized', 'conflict'])

/**
 * The reset page. The token comes from the emailed link (`?token=`), is verified before the form
 * shows, and is sent with the new password. Verifying assumes `GET …/forgot-password/verify` only
 * reads the token (docs/product/open-questions.md → Admin).
 */
export function useResetPassword() {
  const route = useRoute()
  const session = useSession()
  const token = typeof route.query.token === 'string' && route.query.token ? route.query.token : undefined
  const done = shallowRef(false)
  // Kept through a retry, so the alert doesn't flash away and back.
  const failure = shallowRef<string>()

  const link = useApiQuery(
    `auth:reset-link:${token ?? ''}`,
    ({ signal }) => api.get('/admin/auth/forgot-password/verify', { query: { token: token ?? '' }, auth: false, signal, model: resetLinkModel }),
    { enabled: () => !!token && !done.value },
  )

  const state = computed<ResetLinkState>(() => {
    if (done.value) return 'done'
    if (!token) return 'invalid'
    if (link.data.value) return 'ready'
    const error = link.error.value
    if (!error || link.pending.value) return 'checking'
    return REFUSED.has(error.kind) ? 'invalid' : 'unavailable'
  })

  // A refusal shows inline above the form, next to what was typed, not in a toast.
  const reset = useApiMutation(
    (body: { token: string, newPassword: string }) => api.post('/admin/auth/forgot-password/confirm', { body, auth: false }),
    { error: false },
  )

  async function submit(form: IResetPasswordSchema) {
    if (!token || state.value !== 'ready') return false
    const result = await reset.execute({ token, newPassword: form.newPassword })
    if (!result.ok) {
      if (!result.error.silent) failure.value = result.error.message
      // The refusal may be the link (it expired, or was used in another tab) or the password.
      // Checking the link again shows the expired screen in the first case, the reason in the second.
      if (REFUSED.has(result.error.kind)) await link.refresh()
      return false
    }
    done.value = true
    // The token is used up: drop it from the address bar and history. `history.replaceState`, not
    // the router, so the guest guard doesn't run and leave the "Password changed" screen.
    window.history.replaceState(window.history.state, '', route.path)
    // The API sets session cookies on success. The password is changed even if the session
    // doesn't load; the done screen then sends the staff member to sign in.
    await session.reload()
    return true
  }

  return {
    state,
    /** The account being reset, when the API names it. */
    email: computed(() => link.data.value?.email ?? undefined),
    /** Why the link couldn't be checked, for the `unavailable` state. */
    linkError: link.error,
    checking: link.pending,
    retry: link.refresh,
    pending: reset.pending,
    /** Why the last submit failed, for the inline alert. */
    error: readonly(failure),
    /** After `done`: whether the new session loaded, so "Continue" opens Admin rather than sign-in. */
    signedIn: session.signedIn,
    submit,
  }
}
