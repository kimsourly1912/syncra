import { useSession } from '@/features/session'

export function useSignOut() {
  const session = useSession()

  // If the API doesn't confirm the logout, the session is kept and the toast says why.
  const signOut = useApiMutation(() => session.signOut(), { error: 'Could not sign out' })

  return {
    pending: signOut.pending,
    submit: () => signOut.execute(),
  }
}
