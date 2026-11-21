import type { IForgotEmailSchema } from '@/schema/auth.schema'
import { forgotPassword } from '../services/auth.service'

export function useForgotPassword() {
  const toast = useAppToast()
  const pending = shallowRef(false)
  const sent = shallowRef(false)

  async function submit(form: IForgotEmailSchema) {
    pending.value = true
    try {
      const result = await forgotPassword({ email: form.email })
      if (!result.sent) {
        toast.failed('Could not send the reset link')
        return false
      }
      sent.value = true
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
    sent,
    submit,
  }
}
