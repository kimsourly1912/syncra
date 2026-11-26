import type { ISignInSchema } from '../schemas/sign-in-form'
import { redirectTarget, useSession } from '@/features/session'
import { useAuthLinks } from './useAuthLinks'

export function useSignIn() {
  const session = useSession()
  const route = useRoute()
  const router = useRouter()
  const { email } = useAuthLinks()
  // Kept through a retry, so the alert doesn't flash away and back; cleared once sign-in succeeds.
  const failure = shallowRef<string>()

  // A refused sign-in shows inline above the form, next to what was typed, not in a toast.
  const signIn = useApiMutation(
    (form: ISignInSchema) => session.signIn({ email: form.email, password: form.password }),
    { success: 'Welcome to Syncra', error: false },
  )

  async function submit(form: ISignInSchema) {
    const result = await signIn.execute(form)
    if (!result.ok) {
      if (!result.error.silent) failure.value = result.error.message
      return false
    }
    failure.value = undefined
    email.value = ''
    await router.push(redirectTarget(route.query.redirect))
    return true
  }

  return {
    pending: signIn.pending,
    /** Why the last attempt failed, for the inline alert. */
    error: readonly(failure),
    submit,
  }
}
