import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types'

export function useAPI<T, R extends NitroFetchRequest = NitroFetchRequest>(endpoint: R, options: NitroFetchOptions<R> = {}) {
  const { $api } = useNuxtApp()
  return $api<T, R>(endpoint, options)
}
