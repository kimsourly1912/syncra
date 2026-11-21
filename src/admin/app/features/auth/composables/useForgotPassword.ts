import type { IForgotEmailSchema } from '@/schema/auth.schema'
import { forgotPassword } from '../services/auth.service'

export function useForgotPassword() {
  const toast = useAppToast()
  const pending = shallowRef(false)
  const sent = shallowRef(false)

  async function submit(form: IForgotEmailSchema) {
    pending.value = true
    try {
      const res = await forgotPassword({ email: form.email })
      if (!res.success || !res.data.sent) {
        toast.failed((!res.success && res.reason) || 'Could not send the reset link')
        return false
      }
      sent.value = true
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
    sent,
    submit,
  }
}
