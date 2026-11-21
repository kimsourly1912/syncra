import { ASYNC_DATA } from '@/constants/key'
import type { StaffProfile } from '@/models/staff-profile'

export function useProfile() {
  const key = ASYNC_DATA.profile
  const nuxtApp = useNuxtApp()

  const nuxtData = useNuxtData<StaffProfile>(key)
  const clear = () => clearNuxtData(key)
  const refresh = () => refreshNuxtData(key)

  const data = computed(() => nuxtData.data.value)
  const pending = computed(() => Boolean(nuxtApp._asyncData[key]?.pending.value))

  return {
    key,
    data,
    pending,
    clear,
    refresh,
  }
}
