import type { ISignInSchema } from '@/schema/auth.schema'
import { redirectTarget, useSession } from '@/features/session'

export function useSignIn() {
  const session = useSession()
  const route = useRoute()
  const router = useRouter()
  const toast = useAppToast()
  const pending = shallowRef(false)

  async function submit(form: ISignInSchema) {
    pending.value = true
    try {
      await session.signIn({ email: form.email, password: form.password })
      await router.push(redirectTarget(route.query.redirect))
      toast.success('Welcome to Syncra')
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
    submit,
  }
}
