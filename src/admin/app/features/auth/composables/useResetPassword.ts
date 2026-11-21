import type { IChangePasswordSchema } from '@/schema/auth.schema'
import { confirmReset } from '../services/auth.service'

export function useResetPassword() {
  const auth = useAuth()
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
      const res = await confirmReset({ token, newPassword: form.newPassword })
      if (!res.success) {
        toast.failed(res.reason || 'Could not reset the password')
        return false
      }
      await auth.onSuccess(() => {
        success.value = true
      })
      return true
    }
    catch (e) {
      toast.exception(e)
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
