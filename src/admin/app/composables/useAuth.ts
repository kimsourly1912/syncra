import { STATE } from '@/constants/key'
import { logout } from '@/services/session.service'

type AuthStatus = 'UNKNOWN' | 'AUTHENTICATED' | 'UNAUTHENTICATED'

export function useAuth() {
  const profile = useProfile()

  const authState = useState<AuthStatus>(STATE.auth, () => 'UNKNOWN')
  const isAuthenticated = computed(() => authState.value === 'AUTHENTICATED')

  async function onSuccess(fn: () => void | Promise<void>) {
    await profile.refresh()
    // refreshNuxtData doesn't throw, so confirm the profile actually loaded.
    if (!profile.data.value) throw new Error('Signed in, but your profile could not be loaded. Please try again.')
    setAuthState('AUTHENTICATED')
    await fn()
  }

  function logoutProps() {
    const pending = shallowRef(false)

    async function execute() {
      pending.value = true
      try {
        await logout()
        setAuthState('UNAUTHENTICATED')
        await navigateTo(toRoute('/auth/sign-in'))
        profile.clear()
      }
      finally {
        pending.value = false
      }
    }

    return {
      pending,
      execute,
    }
  }

  function setAuthState(value: AuthStatus) {
    authState.value = value
  }

  return {
    authState,
    isAuthenticated,
    onSuccess,
    logoutProps,
    setAuthState,
  }
}
