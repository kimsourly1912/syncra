import type { ISignInSchema } from '@/schema/auth.schema'
import { signIn } from '../services/auth.service'

export function useSignIn() {
  const auth = useAuth()
  const toast = useAppToast()
  const pending = shallowRef(false)

  async function submit(form: ISignInSchema) {
    pending.value = true
    try {
      const res = await signIn({ email: form.email, password: form.password })
      if (!res.success) {
        toast.failed(res.reason || 'Could not sign in')
        return false
      }
      await auth.onSuccess(async () => {
        await navigateTo(toRoute('/'))
        toast.success('Welcome to Syncra')
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
    submit,
  }
}
