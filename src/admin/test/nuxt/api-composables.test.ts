import { defineComponent, h, reactive, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useRouter } from '#imports'
import { api } from '../../app/api'
import { useApiMutation } from '../../app/composables/useApiMutation'
import { invalidateQueries, useApiQuery } from '../../app/composables/useApiQuery'
import { useListQuery } from '../../app/composables/useListQuery'
import { fakeApi, httpError, ok, refused } from '../fake-api'

const { toast, route } = vi.hoisted(() => ({
  toast: { add: vi.fn() },
  route: { query: {} as Record<string, string> },
}))

mockNuxtImport('useToast', () => () => toast)
mockNuxtImport('useRoute', () => () => route)

/** Runs a composable inside a mounted component, as a screen would. */
async function inComponent<T>(setup: () => T) {
  let result!: T
  await mountSuspended(defineComponent({
    setup() {
      result = setup()
      return () => h('div')
    },
  }))
  return result
}

const ME = 'GET /admin/users/me/profile'
let keySeq = 0

beforeEach(() => {
  vi.clearAllMocks()
  route.query = {}
  keySeq++
})

describe('useApiQuery', () => {
  it('loads data and reports a refusal as an ApiError', async () => {
    fakeApi({ [ME]: refused('No profile') })
    const query = await inComponent(() => useApiQuery(`test:a${keySeq}`, ({ signal }) => api.get('/admin/users/me/profile', { signal })))
    await flushPromises()

    expect(query.data.value).toBeUndefined()
    expect(query.error.value).toMatchObject({ name: 'ApiError', kind: 'rejected', message: 'No profile' })
  })

  it('keeps the last data when a refresh fails for the connection, not for a refusal', async () => {
    let answer: () => unknown = () => ({ id: 1 })
    fakeApi({ [ME]: () => answer() })
    const query = await inComponent(() => useApiQuery(`test:b${keySeq}`, () => api.get('/admin/users/me/profile', { envelope: false }).then(() => 'loaded')))
    await flushPromises()
    expect(query.data.value).toBe('loaded')

    answer = () => {
      throw Object.assign(new Error('offline'), { name: 'FetchError', cause: new TypeError('Failed to fetch') })
    }
    await query.refresh()
    expect(query.error.value?.kind).toBe('network')
    expect(query.data.value).toBe('loaded')

    answer = () => {
      throw httpError(404)
    }
    await query.refresh()
    expect(query.data.value).toBeUndefined()
  })

  it('waits while disabled, and loads once enabled', async () => {
    const { transport } = fakeApi({ [ME]: ok({}) })
    const enabled = ref(false)
    const query = await inComponent(() => useApiQuery(`test:c${keySeq}`, () => api.get('/admin/users/me/profile'), { enabled }))
    await flushPromises()
    expect(transport).not.toHaveBeenCalled()

    enabled.value = true
    await flushPromises()
    expect(transport).toHaveBeenCalledOnce()
    expect(query.error.value).toBeUndefined()
  })

  it('refetches when the key changes', async () => {
    const page = ref(1)
    const fetcher = vi.fn(async () => page.value)
    const query = await inComponent(() => useApiQuery(() => `test:d${keySeq}:${page.value}`, fetcher))
    await flushPromises()

    page.value = 2
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(query.data.value).toBe(2)
  })

  it('refreshes the matching queries on invalidate', async () => {
    const listed = vi.fn(async () => 'list')
    const other = vi.fn(async () => 'other')
    await inComponent(() => [useApiQuery(`reviews${keySeq}:list`, listed), useApiQuery(`products${keySeq}:list`, other)])
    await flushPromises()

    await invalidateQueries(`reviews${keySeq}`)
    expect(listed).toHaveBeenCalledTimes(2)
    expect(other).toHaveBeenCalledOnce()
  })
})

describe('useApiMutation', () => {
  it('resolves ok with the data and shows the success message', async () => {
    const mutation = await inComponent(() => useApiMutation(async (n: number) => n * 2, { success: 'Saved' }))

    expect(await mutation.execute(2)).toEqual({ ok: true, data: 4 })
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ description: 'Saved', color: 'success' }))
  })

  it('never throws: a failure resolves not ok, with a toast titled for the action', async () => {
    fakeApi({ 'POST /admin/auth/logout': refused('Session already closed') })
    const mutation = await inComponent(() => useApiMutation(() => api.post('/admin/auth/logout', { auth: false }), { error: 'Could not sign out' }))

    const result = await mutation.execute()
    expect(result).toMatchObject({ ok: false, error: { kind: 'rejected' } })
    expect(mutation.error.value?.message).toBe('Session already closed')
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'Could not sign out', description: 'Session already closed', color: 'error' }))
  })

  it('shows nothing for a silent failure (a cancelled request, an ended session)', async () => {
    const cancelled = Object.assign(new Error('aborted'), { name: 'FetchError', cause: Object.assign(new Error('x'), { name: 'AbortError' }) })
    const mutation = await inComponent(() => useApiMutation(async () => {
      throw cancelled
    }))

    expect((await mutation.execute()).ok).toBe(false)
    expect(toast.add).not.toHaveBeenCalled()
  })

  it('skips a second call while the first is running', async () => {
    let release!: () => void
    const fn = vi.fn(() => new Promise<void>((resolve) => {
      release = resolve
    }))
    const mutation = await inComponent(() => useApiMutation(fn))

    const first = mutation.execute()
    const second = await mutation.execute()
    expect(second.ok).toBe(false)
    release()
    expect((await first).ok).toBe(true)
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('useListQuery', () => {
  let router: ReturnType<typeof useRouter>

  beforeEach(() => {
    router = useRouter()
    // Nuxt navigates too (with no query); only the list's own calls change the mocked URL.
    const navigate = async (to: { query?: Record<string, string> }) => {
      if (to && typeof to === 'object' && to.query) route.query = to.query
    }
    vi.spyOn(router, 'push').mockImplementation(navigate as never)
    vi.spyOn(router, 'replace').mockImplementation(navigate as never)
  })

  it('reads filters and a 1-based page from the URL', async () => {
    route.query = { status: 'reviewed', page: '3' }
    const list = await inComponent(() => reactive(useListQuery({ status: ['in-review', 'reviewed'] as const })))

    expect(list.filters).toEqual({ status: 'reviewed' })
    expect(list.page).toBe(3)
  })

  it('reads unknown values as the defaults', async () => {
    route.query = { status: 'archived', page: '-1' }
    const list = await inComponent(() => reactive(useListQuery({ status: ['in-review', 'reviewed'] as const })))

    expect(list.filters).toEqual({ status: 'in-review' })
    expect(list.page).toBe(1)
  })

  it('goes back to page 1 on a filter change, and leaves defaults out of the URL', async () => {
    route.query = { page: '4' }
    const list = await inComponent(() => useListQuery({ status: ['in-review', 'reviewed'] as const }))

    await list.setFilters({ status: 'reviewed' })
    expect(router.push).toHaveBeenLastCalledWith({ query: { status: 'reviewed' } })

    await list.setFilters({ status: 'in-review' })
    expect(router.push).toHaveBeenLastCalledWith({ query: {} })
  })

  it('moves a page past the end back to the last page', async () => {
    route.query = { page: '5' }
    const list = await inComponent(() => useListQuery({ status: ['in-review', 'reviewed'] as const }))

    list.clampPage(2)
    expect(router.replace).toHaveBeenCalledWith({ query: { page: '2' } })
  })
})
