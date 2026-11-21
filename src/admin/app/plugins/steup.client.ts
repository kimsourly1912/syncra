import { getProfile } from '@/services/session.service'

export default defineNuxtPlugin(async (_) => {
  const { key } = useProfile()
  const { setAuthState } = useAuth()

  await useAsyncData(key, async () => {
    const res = await getProfile()
    // Without a profile the state stays UNKNOWN, and the auth middleware sends the user to sign-in.
    if (!res.success) throw new Error(res.reason || 'Could not load your profile')
    setAuthState('AUTHENTICATED')
    return res.data
  }, { dedupe: 'defer' })
})
