import { useBroadcastChannel } from '@vueuse/core'
import { redirectTarget } from '../utils/paths'
import { setSessionAnnouncer, useSession } from './useSession'
import type { SessionEvent } from './useSession'

/**
 * Keeps tabs in step: signing in or out in one tab updates the others. Only the event crosses
 * tabs; each tab loads its own profile. Call once, from the session plugin.
 */
export function useSessionSync() {
  const session = useSession()
  const router = useRouter()
  // `at` makes repeated events distinct, so the watcher sees each one.
  const { isSupported, data, post } = useBroadcastChannel<{ event: SessionEvent, at: number }, { event: SessionEvent, at: number }>({
    name: 'syncra-admin:session',
  })
  if (!isSupported.value) return

  setSessionAnnouncer(event => post({ event, at: Date.now() }))

  watch(data, async (message) => {
    if (message?.event === 'signed-out') return session.end('signed-out-elsewhere')
    if (message?.event !== 'signed-in') return
    await session.reload()
    const route = router.currentRoute.value
    if (session.signedIn.value && route.meta.access === 'guest') await router.push(redirectTarget(route.query.redirect))
  })
}
