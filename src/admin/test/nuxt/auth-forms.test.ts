import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useForgotPassword, useResetPassword, useSignIn } from '../../app/features/auth'

const { rawApi, onSuccess, toast } = vi.hoisted(() => ({
  rawApi: vi.fn(),
  onSuccess: vi.fn(),
  toast: { success: vi.fn(), failed: vi.fn(), exception: vi.fn() },
}))

mockNuxtImport('useRawAPI', () => rawApi)
mockNuxtImport('useAuth', () => () => ({ onSuccess }))
mockNuxtImport('useAppToast', () => () => toast)

const form = { email: 'staff@example.test', password: 'not-a-real-password' }

beforeEach(() => {
  vi.resetAllMocks()
})

describe('sign-in', () => {
  it('signs in only after the API confirms success', async () => {
    rawApi.mockResolvedValueOnce({ success: true, msg: 'ok', reason: null, data: {} })
    const { submit } = useSignIn()

    expect(await submit(form)).toBe(true)
    expect(rawApi).toHaveBeenCalledWith('admin/auth/login', { body: form, method: 'POST' })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('shows the reason and stays signed out when the API resolves with success: false', async () => {
    rawApi.mockResolvedValueOnce({ success: false, msg: null, reason: 'Invalid credentials', data: null })
    const { submit, pending } = useSignIn()

    expect(await submit(form)).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(toast.failed).toHaveBeenCalledWith('Invalid credentials')
    expect(pending.value).toBe(false)
  })

  it('reports a thrown request error', async () => {
    const error = new Error('network')
    rawApi.mockRejectedValueOnce(error)
    const { submit } = useSignIn()

    expect(await submit(form)).toBe(false)
    expect(toast.exception).toHaveBeenCalledWith(error)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('forgot password', () => {
  it('shows the sent state only when the API says the link was sent', async () => {
    rawApi.mockResolvedValueOnce({ success: true, data: { sent: true } })
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(true)
    expect(sent.value).toBe(true)
  })

  it('fails when the link was not sent', async () => {
    rawApi.mockResolvedValueOnce({ success: true, data: { sent: false } })
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sent.value).toBe(false)
    expect(toast.failed).toHaveBeenCalledWith('Could not send the reset link')
  })

  it('treats a response without `sent` as a contract error', async () => {
    rawApi.mockResolvedValueOnce({ success: true, data: { sent: null } })
    const { submit, sent } = useForgotPassword()

    expect(await submit({ email: form.email })).toBe(false)
    expect(sent.value).toBe(false)
    expect(toast.exception.mock.calls[0]?.[0]).toMatchObject({ name: 'ApiContractError' })
  })
})

describe('reset password', () => {
  const passwords = { newPassword: 'Sample-Passw0rd', confirmPassword: 'Sample-Passw0rd' }

  it('does not call the API without a token', async () => {
    const { submit } = useResetPassword()

    expect(await submit(undefined, passwords)).toBe(false)
    expect(rawApi).not.toHaveBeenCalled()
    expect(toast.failed).toHaveBeenCalledWith('No token provided')
  })

  it('sends only the token and the new password', async () => {
    rawApi.mockResolvedValueOnce({ success: true, data: { payload: null } })
    const { submit } = useResetPassword()

    expect(await submit('sample-token', passwords)).toBe(true)
    expect(rawApi).toHaveBeenCalledWith('admin/auth/forgot-password/confirm', {
      body: { token: 'sample-token', newPassword: 'Sample-Passw0rd' },
      method: 'POST',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('shows the reason when the API rejects the reset', async () => {
    rawApi.mockResolvedValueOnce({ success: false, reason: 'Token expired' })
    const { submit, success } = useResetPassword()

    expect(await submit('sample-token', passwords)).toBe(false)
    expect(success.value).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(toast.failed).toHaveBeenCalledWith('Token expired')
  })
})
