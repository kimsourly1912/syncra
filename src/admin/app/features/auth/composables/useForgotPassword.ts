import { useCountdown } from '@vueuse/core'
import { api } from '@/api'
import type { IForgotPasswordSchema } from '../schemas/forgot-password-form'
import { forgotPasswordResultModel } from '../models/forgot-password'

/** Seconds before the same link can be sent again. */
export const RESEND_COOLDOWN = 60

const NOT_SENT = 'We couldn\'t send a reset link to this address.'

export function useForgotPassword() {
  const toast = useAppToast()
  /** The address the link went to; set once the API says it was sent. */
  const sentTo = shallowRef<string>()
  const failure = shallowRef<string>()
  const cooldown = useCountdown(RESEND_COOLDOWN)

  // Failures show inline (`error`), on the form or on the sent screen.
  const request = useApiMutation(
    (email: string) => api.post('/admin/auth/forgot-password', { body: { email }, auth: false, model: forgotPasswordResultModel }),
    { error: false },
  )

  // `failure` stays through a retry, so the alert doesn't flash away and back; a sent link clears it.
  async function send(email: string) {
    const result = await request.execute(email)
    if (!result.ok) {
      if (!result.error.silent) failure.value = result.error.message
      return false
    }
    if (!result.data.sent) {
      failure.value = NOT_SENT
      return false
    }
    failure.value = undefined
    sentTo.value = email
    cooldown.start()
    return true
  }

  function submit(form: IForgotPasswordSchema) {
    return send(form.email)
  }

  /** Sends the link to the same address again, once the cooldown is over. */
  async function resend() {
    if (!sentTo.value || cooldown.remaining.value > 0) return false
    const sent = await send(sentTo.value)
    if (sent) toast.success(`We sent another reset link to ${sentTo.value}.`, 'Link sent')
    return sent
  }

  /** Back to the form, to send the link to another address. */
  function startOver() {
    sentTo.value = undefined
    failure.value = undefined
    cooldown.stop()
  }

  return {
    pending: request.pending,
    sentTo: readonly(sentTo),
    error: readonly(failure),
    /** Seconds left before `resend` is allowed. */
    cooldown: cooldown.remaining,
    submit,
    resend,
    startOver,
  }
}
