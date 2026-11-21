import { ApiError } from '@/api'

/** The queries on screen, so `invalidateQueries` can refresh them after a write. */
const mounted = new Set<{ key: () => string, refresh: () => Promise<unknown> }>()

/**
 * Refreshes every query on screen whose key starts with one of `features` (`'techpack-reviews'`
 * matches `techpack-reviews:list:…`). Queries that aren't on screen load fresh when next shown.
 */
export async function invalidateQueries(...features: string[]) {
  const matches = [...mounted].filter(query => features.some(feature => query.key().startsWith(`${feature}:`)))
  await Promise.all(matches.map(query => query.refresh()))
}

/**
 * Reads API data into a component. Wraps `useAsyncData`, so components using the same key share
 * one request and its data.
 *
 * - `key` is `'<feature>:<name>:<inputs…>'`. A getter key refetches when it changes, so put every
 *   input the request uses into it. `invalidateQueries('<feature>')` refreshes it after a write.
 * - The fetcher gets a `signal`: a newer load cancels the older one, so a slow response can't
 *   overwrite a newer one.
 * - `error` is an `ApiError`. When a refresh fails for the connection or the server, the data
 *   from the last good load stays on screen (same key only).
 * - `loading` is a load with nothing to show for this key: the first load, and a new key (a filter,
 *   search, or page change). `refreshing` is a reload of the same key with its data still shown.
 *
 * @example
 * const review = useApiQuery(
 *   () => `techpack-reviews:item:${fileId}`,
 *   ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, signal, model: reviewItemModel }),
 * )
 */
export function useApiQuery<T>(
  key: MaybeRefOrGetter<string>,
  fetcher: (context: { signal: AbortSignal }) => Promise<T>,
  options: {
    /** `false` waits for `refresh()`; a getter is re-read on each change, e.g. to wait for an input. */
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  if (import.meta.dev && !/^[\w-]+:/.test(toValue(key))) {
    console.warn(`[useApiQuery] key "${toValue(key)}" should be "<feature>:<name>" so invalidateQueries() can find it.`)
  }

  const enabled = () => toValue(options.enabled ?? true)
  // Nuxt skips loads while `enabled` is false, but doesn't load when it turns true.
  const asyncData = useAsyncData(key, (_nuxtApp, { signal }) => fetcher({ signal }), { enabled })
  watch(enabled, (now) => {
    if (now && asyncData.status.value === 'idle') void asyncData.refresh()
  })

  const error = computed(() => (asyncData.error.value ? ApiError.from(asyncData.error.value) : undefined))

  // Nuxt resets `data` when a load fails. Keep the last good data for a transient failure, so
  // a dropped connection doesn't empty the screen. Never across keys: that's other data.
  const kept = shallowRef<{ key: string, value: T }>()
  watch(asyncData.data, (value) => {
    if (value != null) kept.value = { key: toValue(key), value: value as T }
  })

  // While a new key loads (another filter, search, or page), Nuxt keeps showing the previous key's
  // data. Those are another query's rows, so they don't count: the new key is loading, not
  // refreshing. `dataKey` is the key the current data was loaded for.
  const dataKey = shallowRef<string>()
  watch(asyncData.data, () => {
    dataKey.value = toValue(key)
  }, { immediate: true, flush: 'sync' })

  const data = computed<T | undefined>(() => {
    const value = asyncData.data.value as T | undefined
    if (value != null && dataKey.value === toValue(key)) return value
    return error.value?.retryable && kept.value?.key === toValue(key) ? kept.value.value : undefined
  })

  const refresh = () => asyncData.refresh({ dedupe: 'cancel' })

  const entry = { key: () => toValue(key), refresh: () => (enabled() ? refresh() : Promise.resolve()) }
  mounted.add(entry)
  if (getCurrentScope()) onScopeDispose(() => mounted.delete(entry))

  const pending = computed(() => asyncData.status.value === 'pending')
  return {
    data,
    error,
    /** Any load in flight. */
    pending,
    /** First load: nothing to show yet. */
    loading: computed(() => pending.value && data.value == null),
    /** Reloading while the previous data is still shown. */
    refreshing: computed(() => pending.value && data.value != null),
    refresh,
  }
}
