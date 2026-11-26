import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useNuxtApp, useRouter } from '#imports'
import * as v from 'valibot'
import type { $Fetch } from 'ofetch'
import { configureApi } from '@/api'
import { RESEND_COOLDOWN, resetPasswordSchema, signInSchema, useAuthLinks, useForgotPassword, useResetPassword, useSignIn, useSignOut } from '..'
import { checkPasswordRules } from '../schemas/reset-password-form'
import { useSession } from '@/features/session'
import { fakeApi, httpError, ok, refused } from '#test/fake-api'

const { route, toast } = vi.hoisted(() => ({
  route: { query: {} as Record<string, string> },
  toast: { add: vi.fn() },
}))

mockNuxtImport('useRoute', () => () => route)
mockNuxtImport('useToast', () => () => toast)

const form = { email: 'staff@example.test', password: 'not-a-real-password' }
const LOGIN = 'POST /admin/auth/login'
const ME = 'GET /admin/users/me/profile'
const profile = ok({ id: 7, username: 'sample-staff', email: 'staff@example.test' })
const router = { push: vi.fn() }

beforeEach(async () => {
  vi.clearAllMocks()
  router.push = vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)
  route.query = {}
  // Let the app's own first load settle, then start every test signed out.
  await useSession().load()
  clearNuxtState(['session:status', 'session:staff'])
})

describe('form schemas', () => {
  const messages = (schema: v.GenericSchema, input: unknown) =>
    v.safeParse(schema, input).issues?.map(issue => issue.message) ?? []

  it('requires a valid email and a password to sign in', () => {
    expect(messages(signInSchema, form)).toEqual([])
    // UForm shows each field's first message.
    expect(messages(signInSchema, { email: '', password: '' })).toEqual(['This field is required', 'Invalid email', 'This field is required'])
    expect(messages(signInSchema, { email: 'not-an-email', password: 'x' })).toEqual(['Invalid email'])
  })

  it('checks each password rule on its own', () => {
    expect(checkPasswordRules('abc def').map(rule => rule.valid)).toEqual([false, false, false, false])
    expect(checkPasswordRules('Sample-Passw0rd').map(rule => rule.valid)).toEqual([true, true, true, true])
    expect(checkPasswordRules('samplepassw0rd!').map(rule => rule.valid)).toEqual([true, true, false, true])
  })

  it('rejects a weak or mismatched new password', () => {
    expect(messages(resetPasswordSchema, { newPassword: 'Sample-Passw0rd', confirmPassword: 'Sample-Passw0rd' })).toEqual([])
    expect(messages(resetPasswordSchema, { newPassword: 'weak', confirmPassword: 'weak' })).toEqual(['Password too weak'])
    expect(messages(resetPasswordSchema, { newPassword: 'Sample-Passw0rd', confirmPassword: 'Other-Passw0rd' })).toEqual(['Passwords do not match.'])
  })
})

describe('sign-in', () => {
  it('signs in, loads the profile, and goes home', async () => {
    const { transport } = fakeApi({ [LOGIN]: ok({}), [ME]: profile })
    const { submit } = useSignIn()

    expect(await submit(form)).toBe(true)
    expect(transport).toHaveBeenCalledWith('/admin/auth/login', expect.objectContaining({ method: 'POST', body: form }))
    expect(useSession().staff.value).toMatchObject({ id: 7 })
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('returns to an in-app redirect, and ignores one to another site', async () => {
    fakeApi({ [LOGIN]: ok({}), [ME]: profile })
    route.query = { redirect: '/techpack-reviews/101' }
    await useSignIn().submit(form)
    expect(router.push).toHaveBeenLastCalledWith('/techpack-reviews/101')

    clearNuxtState(['session:status', 'session:staff'])
    route.query = { redirect: '//evil.example' }
    await useSignIn().submit(form)
    expect(router.push).toHaveBeenLastCalledWith('/')
  })

  it('shows the API reason inline and stays signed out when the credentials are refused', async () => {
    const { transport } = fakeApi({ [LOGIN]: refused('Invalid credentials') })
    const { submit, pending, error } = useSignIn()

    expect(await submit(form)).toBe(false)
    expect(error.value).toBe('Invalid credentials')
    expect(toast.add).not.toHaveBeenCalled()
    expect(transport).toHaveBeenCalledOnce()
    expect(useSession().signedIn.value).toBe(false)
    expect(pending.value).toBe(false)
  })

  it('keeps the error while retrying, and clears it once signed in', async () => {
    let attempt = 0
    let release!: () => void
    fakeApi({
      [LOGIN]: () => {
        attempt++
        if (attempt === 1) return refused('Incorrect username or password.')
        return new Promise((resolve) => {
          release = () => resolve(ok({}))
        })
      },
      [ME]: profile,
    })
    const { submit, error } = useSignIn()
    await submit(form)

    const retry = submit(form)
    await vi.waitFor(() => expect(attempt).toBe(2))
    expect(error.value).toBe('Incorrect username or password.')

    release()
    expect(await retry).toBe(true)
    expect(error.value).toBeUndefined()
  })

  it('fails when the profile can\'t be loaded after signing in', async () => {
    fakeApi({ [LOGIN]: ok({}), [ME]: ok({ id: null }) })
    const { submit, error } = useSignIn()

    expect(await submit(form)).toBe(false)
    expect(error.value).toBe('Signed in, but your profile could not be loaded. Please try again.')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('forgets the typed email once signed in', async () => {
    fakeApi({ [LOGIN]: ok({}), [ME]: profile })
    useAuthLinks().email.value = form.email

    await useSignIn().submit(form)

    expect(useAuthLinks().email.value).toBe('')
  })
})

describe('links between the guest pages', () => {
  it('keep the redirect, so signing in after Forgot password returns to the asked page', () => {
    route.query = { redirect: '/techpack-reviews/101' }
    const links = useAuthLinks()

    expect(links.forgot.value).toEqual({ path: '/auth/forgot', query: { redirect: '/techpack-reviews/101' } })
    expect(links.signIn.value).toEqual({ path: '/auth/sign-in', query: { redirect: '/techpack-reviews/101' } })
  })

  it('add no query without a redirect', () => {
    expect(useAuthLinks().forgot.value).toEqual({ path: '/auth/forgot', query: {} })
  })
})

describe('sign-out', () => {
  it('clears the session after the API confirms', async () => {
    fakeApi({ [ME]: profile, 'POST /admin/auth/logout': ok() })
    await useSession().load()

    await useSignOut().submit()

    expect(useSession().status.value).toBe('signed-out')
    expect(router.push).toHaveBeenCalledWith('/auth/sign-in')
  })

  it('keeps the session when the logout isn\'t confirmed', async () => {
    fakeApi({
      [ME]: profile,
      'POST /admin/auth/logout': () => {
        throw Object.assign(new Error('offline'), { name: 'FetchError', cause: new TypeError('Failed to fetch') })
      },
    })
    await useSession().load()

    await useSignOut().submit()

    expect(useSession().signedIn.value).toBe(true)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(router.push).not.toHaveBeenCalled()
  })
})

describe('sign-out after the access token expired', () => {
  const LOGOUT = 'POST /admin/auth/logout'

  it('renews the session, then logs out', async () => {
    let expired = true
    const { transport } = fakeApi({
      [ME]: profile,
      [LOGOUT]: () => {
        if (expired) {
          expired = false
          throw httpError(401)
        }
        return ok()
      },
    })
    await useSession().load()

    await useSignOut().submit()

    expect(transport.mock.calls.filter(([url]) => url === '/admin/auth/logout')).toHaveLength(2)
    expect(useSession().status.value).toBe('signed-out')
    expect(router.push).toHaveBeenCalledWith('/auth/sign-in')
    expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
  })

  it('signs out without an error when the session can\'t be renewed', async () => {
    fakeApi({ [ME]: profile })
    await useSession().load()
    configureApi({
      fetch: vi.fn(async () => {
        throw httpError(401)
      }) as unknown as $Fetch,
      renew: async () => {
        throw httpError(500, refused('refreshToken blank'))
      },
      onExpired: () => useSession().end('expired'),
    })

    await useSignOut().submit()

    expect(useSession().status.value).toBe('signed-out')
    expect(router.push).toHaveBeenLastCalledWith('/auth/sign-in')
    expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
  })

  it('forgets the loaded data after signing out', async () => {
    fakeApi({ [ME]: profile, [LOGOUT]: ok() })
    await useSession().load()
    useNuxtApp().payload.data['sample:item'] = { id: 1 }

    await useSignOut().submit()

    expect(useNuxtApp().payload.data['sample:item']).toBeUndefined()
  })
})

describe('forgot password', () => {
  const FORGOT = 'POST /admin/auth/forgot-password'

  it('shows the sent state only when the API says the link was sent', async () => {
    fakeApi({ [FORGOT]: ok({ sent: true }) })
    const { submit, sentTo, cooldown, error } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(true)
    expect(sentTo.value).toBe(form.email)
    expect(cooldown.value).toBe(RESEND_COOLDOWN)
    expect(error.value).toBeUndefined()
  })

  it('shows inline that the link was not sent', async () => {
    fakeApi({ [FORGOT]: ok({ sent: false }) })
    const { submit, sentTo, error } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sentTo.value).toBeUndefined()
    expect(error.value).toBe('We couldn\'t send a reset link to this address.')
    expect(toast.add).not.toHaveBeenCalled()
  })

  it('treats a response without `sent` as a contract error', async () => {
    fakeApi({ [FORGOT]: ok({ sent: null }) })
    const { submit, sentTo, error } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sentTo.value).toBeUndefined()
    expect(error.value).toMatch(/^Unexpected response from POST \/admin\/auth\/forgot-password/)
  })

  it('resends to the same address only after the cooldown', async () => {
    vi.useFakeTimers()
    try {
      const { transport } = fakeApi({ [FORGOT]: ok({ sent: true }) })
      const { submit, resend, cooldown } = useForgotPassword()
      await submit({ email: form.email })

      expect(await resend()).toBe(false)
      expect(transport).toHaveBeenCalledOnce()

      vi.advanceTimersByTime(RESEND_COOLDOWN * 1000)
      expect(cooldown.value).toBe(0)
      expect(await resend()).toBe(true)
      expect(transport).toHaveBeenCalledTimes(2)
      expect(transport).toHaveBeenLastCalledWith('/admin/auth/forgot-password', expect.objectContaining({ body: { email: form.email } }))
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'Link sent' }))
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('goes back to the form to use another address', async () => {
    fakeApi({ [FORGOT]: ok({ sent: true }) })
    const { submit, startOver, sentTo } = useForgotPassword()
    await submit({ email: form.email })

    startOver()

    expect(sentTo.value).toBeUndefined()
  })
})

describe('reset password', () => {
  const VERIFY = 'GET /admin/auth/forgot-password/verify'
  const CONFIRM = 'POST /admin/auth/forgot-password/confirm'
  const passwords = { newPassword: 'Sample-Passw0rd', confirmPassword: 'Sample-Passw0rd' }
  const offline = () => {
    throw Object.assign(new Error('offline'), { name: 'FetchError', cause: new TypeError('Failed to fetch') })
  }
  // The route guard loads the session before the guest page mounts.
  const signedOut = { [ME]: refused('No session') }
  const calledFor = (transport: { mock: { calls: unknown[][] } }, url: string) => transport.mock.calls.some(([called]) => called === url)
  // A token per test: the verify query's key holds the token, and loaded data outlives a test.
  let seq = 0
  let token = ''

  /** Opens the reset page's composable for `?token=`, as the screen does, and lets the link check settle. */
  async function openReset(query: Record<string, string> = { token }) {
    route.query = query
    let result!: ReturnType<typeof useResetPassword>
    await mountSuspended(defineComponent({
      setup() {
        result = useResetPassword()
        return () => h('div')
      },
    }), { route: '/auth/reset' })
    await flushPromises()
    return result
  }

  beforeEach(() => {
    token = `sample-token-${++seq}`
    Object.assign(route, { path: '/auth/reset' })
  })

  it('shows an invalid link without a token, and calls nothing', async () => {
    const { transport } = fakeApi(signedOut)
    const reset = await openReset({})

    expect(reset.state.value).toBe('invalid')
    expect(await reset.submit(passwords)).toBe(false)
    expect(calledFor(transport, '/admin/auth/forgot-password/verify')).toBe(false)
    expect(calledFor(transport, '/admin/auth/forgot-password/confirm')).toBe(false)
  })

  it('checks the link first, and names the account', async () => {
    const { transport } = fakeApi({ ...signedOut, [VERIFY]: ok({ email: form.email }) })
    const reset = await openReset()

    expect(reset.state.value).toBe('ready')
    expect(reset.email.value).toBe(form.email)
    expect(transport).toHaveBeenCalledWith('/admin/auth/forgot-password/verify', expect.objectContaining({ query: { token } }))
  })

  it('shows an expired link when the API refuses the token', async () => {
    fakeApi({ ...signedOut, [VERIFY]: refused('Token expired') })

    expect((await openReset()).state.value).toBe('invalid')
  })

  it('offers a retry when the link can\'t be checked', async () => {
    let down = true
    fakeApi({ ...signedOut, [VERIFY]: () => (down ? offline() : ok({ email: form.email })) })
    const reset = await openReset()
    expect(reset.state.value).toBe('unavailable')

    down = false
    await reset.retry()
    await flushPromises()

    expect(reset.state.value).toBe('ready')
  })

  it('sends only the token and the new password, drops the token from the URL, and loads the new session', async () => {
    // The API sets the session cookies when it confirms the reset.
    let changed = false
    const { transport } = fakeApi({
      [ME]: () => (changed ? profile : signedOut[ME]),
      [VERIFY]: ok({ email: form.email }),
      [CONFIRM]: () => {
        changed = true
        return ok({ payload: null })
      },
    })
    window.history.replaceState(null, '', `/auth/reset?token=${token}`)
    const reset = await openReset()

    expect(await reset.submit(passwords)).toBe(true)
    expect(transport).toHaveBeenCalledWith('/admin/auth/forgot-password/confirm', expect.objectContaining({
      method: 'POST', body: { token, newPassword: 'Sample-Passw0rd' },
    }))
    expect(reset.state.value).toBe('done')
    expect(window.location.search).toBe('')
    expect(reset.signedIn.value).toBe(true)
  })

  it('shows the expired link when the token was used up meanwhile', async () => {
    let used = false
    fakeApi({ ...signedOut, [VERIFY]: () => (used ? refused('Token already used') : ok({ email: form.email })), [CONFIRM]: () => refused('Token already used') })
    const reset = await openReset()
    used = true

    expect(await reset.submit(passwords)).toBe(false)
    await flushPromises()

    expect(reset.state.value).toBe('invalid')
  })

  it('keeps the form with the reason inline when the link is still good', async () => {
    fakeApi({ ...signedOut, [VERIFY]: ok({ email: form.email }), [CONFIRM]: refused('Password was used recently') })
    const reset = await openReset()

    expect(await reset.submit(passwords)).toBe(false)
    await flushPromises()

    expect(reset.state.value).toBe('ready')
    expect(reset.error.value).toBe('Password was used recently')
    expect(toast.add).not.toHaveBeenCalled()
  })
})
