import type { ISignInSchema } from '@/schema/auth.schema'
import { redirectTarget, useSession } from '@/features/session'

export function useSignIn() {
  const session = useSession()
  const route = useRoute()
  const router = useRouter()

  const signIn = useApiMutation(
    (form: ISignInSchema) => session.signIn({ email: form.email, password: form.password }),
    { success: 'Welcome to Syncra', error: 'Could not sign in' },
  )

  async function submit(form: ISignInSchema) {
    const result = await signIn.execute(form)
    if (result.ok) await router.push(redirectTarget(route.query.redirect))
    return result.ok
  }

  return {
    pending: signIn.pending,
    submit,
  }
}
