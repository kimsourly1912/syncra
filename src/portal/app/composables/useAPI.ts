import type { FetchError } from 'ofetch'
import { Mutex, withTimeout } from 'async-mutex'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types'
import { refreshTokenByCookie } from '@/services/auth.service'

// these are singleton
let isRefreshing = false
const refreshMutex = new Mutex()
const refreshMutexWithTimeout = withTimeout(refreshMutex, 5000)

export async function useAPI<T, R extends NitroFetchRequest = NitroFetchRequest>(endpoint: R, options: NitroFetchOptions<R> = {}) {
  const { $api } = useNuxtApp()
  const profileStore = useProfileStore()
  const expireCode = 401

  async function makeRequest(): Promise<T> {
    return await $api<T, R>(endpoint, options)
  }

  async function tryRefreshToken() {
    const { data } = await refreshTokenByCookie()
    return data
  }

  async function ensureRefreshOnce() {
    // Fast path: if already refreshing, just wait
    if (isRefreshing) {
      await refreshMutex.waitForUnlock()
      return
    }

    await refreshMutexWithTimeout.runExclusive(async () => {
      // Double-check after acquiring lock
      if (isRefreshing) return

      isRefreshing = true
      try {
        await tryRefreshToken()
      }
      finally {
        isRefreshing = false
      }
    })
  }

  try {
    return await makeRequest()
  }
  catch (err) {
    const e = err as FetchError

    if (e.statusCode !== expireCode) {
      throw e
    }

    try {
      await ensureRefreshOnce()
      // Retry the request with new tokens
      return await makeRequest()
    }
    catch (err) {
      const e = err as FetchError
      // logout immediately if refresh failed or still got expire
      if (e.statusCode === expireCode) {
        await profileStore.onLogout({ dedupe: 'defer' })
      }
      throw e
    }
  }
}

export function useRawAPI<T, R extends NitroFetchRequest = NitroFetchRequest>(endpoint: R, options: NitroFetchOptions<R> = {}) {
  const { $api } = useNuxtApp()
  return $api<T, R>(endpoint, options)
}

export function useFileAPI(endpoint: string) {
  return useAPI<ExtractFileHeaderReturn>(endpoint, {
    method: 'GET',
    onResponse({ response }) {
      const data = response._data
      /**
       * modify response with additional metadata
       */
      if (data instanceof Blob) {
        response._data = extractFileInfo(response, data)
        return data
      }

      return data
    },
  })
}
