import type { IChangePasswordSchema } from '@/schema/auth.schema'
import { useSession } from '@/features/session'
import { confirmReset } from '../services/auth.service'

export function useResetPassword() {
  const session = useSession()
  const toast = useAppToast()
  const pending = shallowRef(false)
  const success = shallowRef(false)

  async function submit(token: string | undefined, form: IChangePasswordSchema) {
    if (!token) {
      toast.failed('No token provided')
      return false
    }

    pending.value = true
    try {
      await confirmReset({ token, newPassword: form.newPassword })
      // The password is changed even if the new session doesn't load; "Continue" then
      // lands on sign-in through the route guard.
      success.value = true
      await session.reload()
      return true
    }
    catch (e) {
      toast.error(e)
      return false
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    success,
    submit,
  }
}
