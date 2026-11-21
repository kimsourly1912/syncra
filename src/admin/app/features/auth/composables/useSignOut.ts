import { useSession } from '@/features/session'

export function useSignOut() {
  const session = useSession()
  const toast = useAppToast()
  const pending = shallowRef(false)

  async function submit() {
    pending.value = true
    try {
      await session.signOut()
    }
    catch (e) {
      // The API didn't confirm the logout, so the session is kept.
      toast.error(e)
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
