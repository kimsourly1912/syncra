import { api } from '@/api'
import type { IChangePasswordSchema } from '@/schema/auth.schema'
import { useSession } from '@/features/session'

export function useResetPassword() {
  const session = useSession()
  const toast = useAppToast()
  const success = shallowRef(false)

  // Sets session cookies on success.
  const reset = useApiMutation(
    (body: { token: string, newPassword: string }) => api.post('/admin/auth/forgot-password/confirm', { body, auth: false }),
    { error: 'Could not reset the password' },
  )

  async function submit(token: string | undefined, form: IChangePasswordSchema) {
    if (!token) {
      toast.failed('No token provided')
      return false
    }
    const result = await reset.execute({ token, newPassword: form.newPassword })
    if (!result.ok) return false
    // The password is changed even if the new session doesn't load; "Continue" then lands on
    // sign-in through the route guard.
    success.value = true
    await session.reload()
    return true
  }

  return {
    pending: reset.pending,
    success,
    submit,
  }
}
