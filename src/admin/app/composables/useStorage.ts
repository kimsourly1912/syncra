import { useStorage as _useStorage } from '@vueuse/core'

interface Preference {
  sidebar: boolean
}

export function useStorage() {
  const keys = {
    preference: 'preference',
  } as const

  const preference = _useStorage<Preference>(keys.preference, { sidebar: false })

  return {
    keys,
    preference,
  }
}
