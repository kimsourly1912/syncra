import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useRouter } from '#imports'
import InputSearch from '@/components/input/InputSearch.vue'
import ListEmptyState from '@/components/list/ListEmptyState.vue'
import ListToolbarTabs from '@/components/list/ListToolbarTabs.vue'
import { useListQuery } from '../useListQuery'
import { REFRESH_MIN_SHOWN, REFRESH_SHOW_DELAY, useRefreshIndicator } from '../useRefreshIndicator'
import { useUrlRecord } from '../useUrlRecord'
import { useUrlTab } from '../useUrlTab'

// Reactive, like the real route: the composables' computed values follow URL changes.
const route = reactive({ query: {} as Record<string, string> })

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

let router: ReturnType<typeof useRouter>

beforeEach(() => {
  route.query = {}
  router = useRouter()
  // Only the composables' own calls change the mocked URL.
  const navigate = async (to: { query?: Record<string, string> }) => {
    if (to && typeof to === 'object' && to.query) route.query = to.query
  }
  vi.spyOn(router, 'push').mockImplementation(navigate as never)
  vi.spyOn(router, 'replace').mockImplementation(navigate as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const STATUS = { status: ['all', 'new', 'contacted'] as const }

describe('useListQuery search and page size', () => {
  it('reads the search and a known page size from the URL', async () => {
    route.query = { search: '  acme ', size: '50', page: '2' }
    const list = await inComponent(() => useListQuery(STATUS, { search: true, pageSizes: [20, 50] }))

    expect(list.search.value).toBe('acme')
    expect(list.pageSize.value).toBe(50)
    expect(list.page.value).toBe(2)
    expect(list.isFiltered.value).toBe(true)
  })

  it('ignores a search on a list without one, and an unknown page size', async () => {
    route.query = { search: 'acme', size: '7' }
    const list = await inComponent(() => useListQuery(STATUS, { pageSizes: [20, 50] }))

    expect(list.search.value).toBe('')
    expect(list.pageSize.value).toBe(20)
    expect(list.isFiltered.value).toBe(false)
  })

  it('keys every URL input, and sends the zero-based page', async () => {
    route.query = { status: 'new', search: ' acme ', size: '50', page: '3' }
    const list = await inComponent(() => useListQuery(STATUS, { search: true, pageSizes: [20, 50] }))

    expect(list.stateKey.value).toBe('status=new&page=3&size=50&search=acme')
    expect(list.apiQuery.value).toEqual({ page: 2, size: 50, search: 'acme' })

    // Defaults are keyed too, so `all` and a missing status can't share a key with another filter.
    route.query = {}
    expect(list.stateKey.value).toBe('status=all&page=1&size=20')
    expect(list.apiQuery.value).toStrictEqual({ page: 0, size: 20, search: undefined })
  })

  it('has no page size when the API has a fixed one', async () => {
    const list = await inComponent(() => useListQuery(STATUS))
    expect(list.pageSize.value).toBeUndefined()
  })

  it('replaces the URL for a search, back on page 1, keeping the filters', async () => {
    route.query = { status: 'new', page: '3' }
    const list = await inComponent(() => useListQuery(STATUS, { search: true }))

    await list.setSearch('  acme ')
    expect(router.replace).toHaveBeenLastCalledWith({ query: { status: 'new', search: 'acme' } })
    expect(router.push).not.toHaveBeenCalled()

    // The same text again is not a change.
    vi.mocked(router.replace).mockClear()
    await list.setSearch('acme')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('goes back to page 1 on a new page size, and leaves the default out', async () => {
    route.query = { page: '4', size: '50' }
    const list = await inComponent(() => useListQuery(STATUS, { pageSizes: [20, 50] }))

    await list.setPageSize(20)
    expect(router.push).toHaveBeenLastCalledWith({ query: {} })
  })

  it('keeps the search and size when the page or a filter changes', async () => {
    route.query = { search: 'acme', size: '50' }
    const list = await inComponent(() => useListQuery(STATUS, { search: true, pageSizes: [20, 50] }))

    await list.setPage(2)
    expect(router.push).toHaveBeenLastCalledWith({ query: { search: 'acme', page: '2', size: '50' } })

    await list.setFilters({ status: 'contacted' })
    expect(router.push).toHaveBeenLastCalledWith({ query: { status: 'contacted', search: 'acme', size: '50' } })
  })

  it('clears the filters and the search, keeping the page size', async () => {
    route.query = { status: 'new', search: 'acme', page: '2', size: '50' }
    const list = await inComponent(() => useListQuery(STATUS, { search: true, pageSizes: [20, 50] }))

    await list.clearFilters()
    expect(router.push).toHaveBeenLastCalledWith({ query: { size: '50' } })
    expect(list.isFiltered.value).toBe(false)
  })
})

describe('useUrlTab', () => {
  const TABS = ['company-information', 'module', 'token'] as const

  it('reads the tab from the URL, and an unknown value as the first tab', async () => {
    route.query = { tab: 'token' }
    const tab = await inComponent(() => useUrlTab(TABS))
    expect(tab.value).toBe('token')

    route.query = { tab: 'billing' }
    expect(tab.value).toBe('company-information')
  })

  it('replaces the URL, leaves the default tab out, and keeps other query values', async () => {
    route.query = { from: 'list' }
    const tab = await inComponent(() => useUrlTab(TABS))

    tab.value = 'module'
    expect(router.replace).toHaveBeenLastCalledWith({ query: { from: 'list', tab: 'module' } })

    tab.value = 'company-information'
    expect(router.replace).toHaveBeenLastCalledWith({ query: { from: 'list' } })
    expect(router.push).not.toHaveBeenCalled()
  })
})

describe('useUrlRecord', () => {
  it('reads a positive whole id, and anything else as none', async () => {
    route.query = { lead: '7' }
    const panel = await inComponent(() => useUrlRecord('lead'))
    expect(panel.id.value).toBe(7)

    for (const value of ['0', '-3', '2.5', 'abc', '']) {
      route.query = { lead: value }
      expect(panel.id.value).toBeUndefined()
    }
  })

  it('opens and closes by replacing the URL, keeping the list query', async () => {
    route.query = { status: 'new', page: '2' }
    const panel = await inComponent(() => useUrlRecord('lead'))

    await panel.open(7)
    expect(router.replace).toHaveBeenLastCalledWith({ query: { status: 'new', page: '2', lead: '7' } })
    expect(panel.id.value).toBe(7)

    await panel.close()
    expect(router.replace).toHaveBeenLastCalledWith({ query: { status: 'new', page: '2' } })
    expect(panel.id.value).toBeUndefined()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('closes when a list filter changes', async () => {
    route.query = { lead: '7' }
    const { list, panel } = await inComponent(() => ({ list: useListQuery(STATUS), panel: useUrlRecord('lead') }))

    await list.setFilters({ status: 'new' })
    expect(panel.id.value).toBeUndefined()
  })
})

describe('useListQuery keepPageInRange', () => {
  it('moves a page past the end to the last page as loads come in, replacing the URL', async () => {
    route.query = { page: '5' }
    const totalPages = ref<number>()
    const list = await inComponent(() => {
      const query = useListQuery(STATUS)
      query.keepPageInRange(() => totalPages.value)
      return query
    })

    // Nothing loaded yet: the page stays.
    await nextTick()
    // (Mounting replaces the URL with '/' itself; only query changes are the composable's.)
    expect(router.replace).not.toHaveBeenCalledWith(expect.objectContaining({ query: expect.anything() }))

    totalPages.value = 3
    await nextTick()
    expect(router.replace).toHaveBeenLastCalledWith({ query: { page: '3' } })
    expect(list.page.value).toBe(3)

    // An empty list goes to page 1, which the URL leaves out.
    totalPages.value = 0
    await nextTick()
    expect(router.replace).toHaveBeenLastCalledWith({ query: {} })
  })
})

describe('ListToolbarTabs', () => {
  it('shows a tab\'s count as a badge, and none for a missing count', async () => {
    const wrapper = await mountSuspended(ListToolbarTabs, {
      props: {
        modelValue: 'all',
        items: [
          { label: 'All', value: 'all', count: 1520 },
          { label: 'Pending', value: 'pending', count: 0 },
          { label: 'Completed', value: 'completed', count: null },
        ],
      },
    })
    const tabs = wrapper.findAll('[role="tab"]').map(tab => tab.text())
    expect(tabs).toEqual(['All1,520', 'Pending0', 'Completed'])
  })
})

describe('useRefreshIndicator', () => {
  it('shows nothing for a short reload, and stays up a minimum time once shown', async () => {
    vi.useFakeTimers()
    const refreshing = ref(false)
    const shown = await inComponent(() => useRefreshIndicator(refreshing))

    refreshing.value = true
    await nextTick()
    vi.advanceTimersByTime(REFRESH_SHOW_DELAY - 10)
    refreshing.value = false
    await nextTick()
    vi.advanceTimersByTime(REFRESH_MIN_SHOWN)
    expect(shown.value).toBe(false)

    refreshing.value = true
    await nextTick()
    vi.advanceTimersByTime(REFRESH_SHOW_DELAY)
    expect(shown.value).toBe(true)

    refreshing.value = false
    await nextTick()
    expect(shown.value).toBe(true)
    vi.advanceTimersByTime(REFRESH_MIN_SHOWN)
    expect(shown.value).toBe(false)
  })
})

describe('InputSearch', () => {
  it('applies the trimmed text after the delay, and at once on Enter or Clear', async () => {
    vi.useFakeTimers()
    const wrapper = await mountSuspended(InputSearch, { props: { modelValue: '', delay: 300 } })
    const input = wrapper.find('input')

    await input.setValue('  acme ')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    vi.advanceTimersByTime(300)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['acme'])

    await wrapper.setProps({ modelValue: 'acme' })
    await input.setValue('globex')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['globex'])

    await wrapper.setProps({ modelValue: 'globex' })
    await wrapper.find('button[aria-label="Clear search"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })
})

describe('ListEmptyState', () => {
  it('offers Clear filters when filters hide every row', async () => {
    const wrapper = await mountSuspended(ListEmptyState, { props: { noun: 'leads', filtered: true } })
    expect(wrapper.text()).toContain('No leads match your filters')

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('offers the create action when nothing exists yet', async () => {
    const wrapper = await mountSuspended(ListEmptyState, { props: { noun: 'leads', createLabel: 'New lead' } })
    expect(wrapper.text()).toContain('No leads yet')

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })
})
