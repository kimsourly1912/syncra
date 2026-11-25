import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useNuxtApp, useRouter } from '#imports'
import * as v from 'valibot'
import type { $Fetch } from 'ofetch'
import { configureApi } from '../../app/api'
import { resetPasswordSchema, signInSchema, useForgotPassword, useResetPassword, useSignIn, useSignOut } from '../../app/features/auth'
import { checkPasswordRules } from '../../app/features/auth/schemas/reset-password-form'
import { useSession } from '../../app/features/session'
import { fakeApi, httpError, ok, refused } from '../fake-api'

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

  it('shows the API reason and stays signed out when the credentials are refused', async () => {
    const { transport } = fakeApi({ [LOGIN]: refused('Invalid credentials') })
    const { submit, pending } = useSignIn()

    expect(await submit(form)).toBe(false)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'Invalid credentials' }))
    expect(transport).toHaveBeenCalledOnce()
    expect(useSession().signedIn.value).toBe(false)
    expect(pending.value).toBe(false)
  })

  it('fails when the profile can\'t be loaded after signing in', async () => {
    fakeApi({ [LOGIN]: ok({}), [ME]: ok({ id: null }) })

    expect(await useSignIn().submit(form)).toBe(false)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'Signed in, but your profile could not be loaded. Please try again.' }))
    expect(router.push).not.toHaveBeenCalled()
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
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(true)
    expect(sent.value).toBe(true)
  })

  it('fails when the link was not sent', async () => {
    fakeApi({ [FORGOT]: ok({ sent: false }) })
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sent.value).toBe(false)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'Could not send the reset link' }))
  })

  it('treats a response without `sent` as a contract error', async () => {
    fakeApi({ [FORGOT]: ok({ sent: null }) })
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sent.value).toBe(false)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringMatching(/^Unexpected response from POST \/admin\/auth\/forgot-password/) }))
  })
})

describe('reset password', () => {
  const CONFIRM = 'POST /admin/auth/forgot-password/confirm'
  const passwords = { newPassword: 'Sample-Passw0rd', confirmPassword: 'Sample-Passw0rd' }

  it('does not call the API without a token', async () => {
    const { transport } = fakeApi()

    expect(await useResetPassword().submit(undefined, passwords)).toBe(false)
    expect(transport).not.toHaveBeenCalled()
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'No token provided' }))
  })

  it('sends only the token and the new password, then loads the new session', async () => {
    const { transport } = fakeApi({ [CONFIRM]: ok({ payload: null }), [ME]: profile })
    const { submit, success } = useResetPassword()

    expect(await submit('sample-token', passwords)).toBe(true)
    expect(success.value).toBe(true)
    expect(transport).toHaveBeenCalledWith('/admin/auth/forgot-password/confirm', expect.objectContaining({
      method: 'POST', body: { token: 'sample-token', newPassword: 'Sample-Passw0rd' },
    }))
    expect(useSession().signedIn.value).toBe(true)
  })

  it('shows the reason when the API rejects the reset', async () => {
    fakeApi({ [CONFIRM]: refused('Token expired') })
    const { submit, success } = useResetPassword()

    expect(await submit('sample-token', passwords)).toBe(false)
    expect(success.value).toBe(false)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'Token expired' }))
  })
})
