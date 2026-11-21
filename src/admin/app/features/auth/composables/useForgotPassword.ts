import { api } from '@/api'
import type { IForgotPasswordSchema } from '../schemas/forgot-password-form'
import { forgotPasswordResultModel } from '../models/forgot-password'

export function useForgotPassword() {
  const toast = useAppToast()
  const sent = shallowRef(false)

  const request = useApiMutation(
    (form: IForgotPasswordSchema) => api.post('/admin/auth/forgot-password', { body: { email: form.email }, auth: false, model: forgotPasswordResultModel }),
    { error: 'Could not send the reset link' },
  )

  async function submit(form: IForgotPasswordSchema) {
    const result = await request.execute(form)
    if (!result.ok) return false
    if (!result.data.sent) {
      toast.failed('Could not send the reset link')
      return false
    }
    sent.value = true
    return true
  }

  return {
    pending: request.pending,
    sent,
    submit,
  }
}
