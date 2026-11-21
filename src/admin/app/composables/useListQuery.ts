/** The largest page the API accepts (a Java int). */
const MAX_PAGE = 2147483647

type Choices<F> = { [K in keyof F]: readonly F[K][] }

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
 * - `page` is 1-based, as the user sees it. Send `page - 1` to the zero-based Admin API.
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
export function useListQuery<F extends Record<string, string>>(choices: Choices<F>, options: ListQueryOptions = {}) {
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

  return {
    filters,
    search,
    page,
    pageSize,
    isFiltered,
    setFilters: (changes: Partial<F>) => go({ ...current(), filters: { ...filters.value, ...changes }, page: 1 }),
    setSearch: (text: string) => {
      const value = text.trim()
      if (value !== search.value) return go({ ...current(), search: value, page: 1 }, true)
    },
    setPage: (next: number) => go({ ...current(), page: next }),
    setPageSize: (size: number) => go({ ...current(), pageSize: size, page: 1 }),
    /** Every filter back to its default and the search emptied; the page size stays. */
    clearFilters: () => go({ ...current(), filters: Object.fromEntries(keys.map(key => [key, choices[key][0]])) as unknown as F, search: '', page: 1 }),
    /** After a load: a page past the end (e.g. its last row was removed) moves to the last page. */
    clampPage: (totalPages: number) => {
      if (page.value > 1 && page.value > totalPages) void go({ ...current(), page: Math.max(1, totalPages) }, true)
    },
  }
}
