/** The largest page the API accepts (a Java int). */
const MAX_PAGE = 2147483647

/** Rows per page for a list whose endpoint takes `size`. The API's default is 20; its largest page isn't documented (open question). */
export const LIST_PAGE_SIZES = [20, 50, 100] as const

/** Each filter's allowed URL values; the first is the default. */
export type ListChoices<F> = { [K in keyof F]: readonly F[K][] }

/** The paging and search a list request sends. The Admin API's `page` is zero-based. */
export interface ListApiQuery {
  page: number
  size?: number
  search?: string
}

export interface ListQueryOptions {
  /** The list has a search box, kept in `?search=`. */
  search?: boolean
  /** Rows-per-page choices, kept in `?size=`. The first is the default. Leave out when the API has a fixed page size. */
  pageSizes?: readonly number[]
}

interface ListState<F> {
  filters: F
  search: string
  page: number
  pageSize: number | undefined
}

/**
 * A list's filters, search, page, and page size, kept in the URL
 * (`/lead-inquiry?status=new&search=acme&page=2&size=50`) so reload, Back, and shared links keep
 * the user's place.
 *
 * - Each filter is one of its `choices`; anything else in the URL reads as the first choice,
 *   which is the default and is left out of the URL. The same goes for the page size.
 * - `page` is 1-based, as the user sees it. `apiQuery` has the zero-based page the Admin API takes.
 * - Changing a filter, the search, or the page size goes back to page 1.
 * - Filter, page, and page-size changes are history entries. A search replaces the current entry,
 *   so Back doesn't step through what was typed.
 *
 * @example
 * const list = useListQuery({ status: ['in-review', 'reviewed'] as const })
 * list.filters.value.status   // 'in-review' | 'reviewed'
 * list.setFilters({ status: 'reviewed' })
 *
 * const leads = useListQuery({ status: ['all', 'new'] as const }, { search: true, pageSizes: [20, 50, 100] })
 * leads.setSearch('acme')
 */
export function useListQuery<F extends Record<string, string>>(choices: ListChoices<F>, options: ListQueryOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const keys = Object.keys(choices) as (keyof F & string)[]
  const pageSizes = options.pageSizes ?? []

  const filters = computed(() => Object.fromEntries(keys.map((key) => {
    const value = route.query[key]
    const allowed = choices[key] as readonly string[]
    return [key, typeof value === 'string' && allowed.includes(value) ? value : allowed[0]]
  })) as F)

  const search = computed(() => {
    const value = route.query.search
    return options.search && typeof value === 'string' ? value.trim() : ''
  })

  const page = computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value >= 1 && value <= MAX_PAGE ? value : 1
  })

  const pageSize = computed(() => {
    const value = Number(route.query.size)
    return pageSizes.includes(value) ? value : pageSizes[0]
  })

  /** Whether a filter or the search hides rows: "No leads match your filters" instead of "No leads yet". */
  const isFiltered = computed(() => search.value !== '' || keys.some(key => filters.value[key] !== choices[key][0]))

  /**
   * The whole URL state as one string (`status=new&page=2&size=50&search=acme`): every input a
   * list request may use, so a query key built from it can't leave a new filter out.
   */
  const stateKey = computed(() => {
    const state = new URLSearchParams()
    for (const key of keys) state.set(key, filters.value[key] ?? '')
    state.set('page', String(page.value))
    if (pageSize.value !== undefined) state.set('size', String(pageSize.value))
    if (search.value) state.set('search', search.value)
    return state.toString()
  })

  /** `page` (zero-based), `size`, and `search`, ready for the request's `query`. Unused ones are `undefined`. */
  const apiQuery = computed((): ListApiQuery => ({
    page: page.value - 1,
    size: pageSize.value,
    search: search.value || undefined,
  }))

  const current = (): ListState<F> => ({ filters: filters.value, search: search.value, page: page.value, pageSize: pageSize.value })

  function go(next: ListState<F>, replace = false) {
    const query: Record<string, string> = {}
    for (const key of keys) {
      const value = next.filters[key]
      if (value !== undefined && value !== choices[key][0]) query[key] = value
    }
    if (next.search) query.search = next.search
    if (next.page > 1) query.page = String(next.page)
    if (next.pageSize !== undefined && next.pageSize !== pageSizes[0]) query.size = String(next.pageSize)
    return replace ? router.replace({ query }) : router.push({ query })
  }

  /** A page past the end moves to the last page. */
  function clampPage(totalPages: number) {
    if (page.value > 1 && page.value > totalPages) void go({ ...current(), page: Math.max(1, totalPages) }, true)
  }

  return {
    filters,
    search,
    page,
    pageSize,
    /** The rows-per-page choices, for `ListPagination`'s `page-sizes`. */
    pageSizes,
    isFiltered,
    stateKey,
    apiQuery,
    setFilters: (changes: Partial<F>) => go({ ...current(), filters: { ...filters.value, ...changes }, page: 1 }),
    setSearch: (text: string) => {
      const value = text.trim()
      if (value !== search.value) return go({ ...current(), search: value, page: 1 }, true)
    },
    setPage: (next: number) => go({ ...current(), page: next }),
    setPageSize: (size: number) => go({ ...current(), pageSize: size, page: 1 }),
    /** Every filter back to its default and the search emptied; the page size stays. */
    clearFilters: () => go({ ...current(), filters: Object.fromEntries(keys.map(key => [key, choices[key][0]])) as unknown as F, search: '', page: 1 }),
    clampPage,
    /**
     * Keeps the page in range as loads come in: pass the query's `totalPages`. A page past the end
     * (its last row was removed, or an old link) moves to the last page.
     *
     * @example list.keepPageInRange(() => leads.data.value?.totalPages)
     */
    keepPageInRange: (totalPages: () => number | undefined) => watch(totalPages, (total) => {
      if (total !== undefined) clampPage(total)
    }),
  }
}
