import { getProfile } from '@/services/profile.service'

export default defineNuxtPlugin(async (_) => {
  const { key } = useProfile()
  const { setAuthState } = useAuth()

  await useAsyncData(key, async () => {
    const { data } = await getProfile()
    setAuthState('AUTHENTICATED')
    return data
  }, { dedupe: 'defer' })
})
