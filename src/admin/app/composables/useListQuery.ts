/** The largest page the API accepts (a Java int). */
const MAX_PAGE = 2147483647

type Choices<F> = { [K in keyof F]: readonly F[K][] }

/**
 * A list's filters and page, kept in the URL (`/techpack-reviews?status=reviewed&page=2`) so
 * reload, Back, and shared links keep the user's place.
 *
 * - Each filter is one of its `choices`; anything else in the URL reads as the first choice,
 *   which is the default and is left out of the URL.
 * - `page` is 1-based, as the user sees it. Send `page - 1` to the zero-based Admin API.
 * - Changing a filter goes back to page 1. Every change is a history entry.
 *
 * @example
 * const list = useListQuery({ status: ['in-review', 'reviewed'] as const })
 * list.filters.value.status   // 'in-review' | 'reviewed'
 * list.setFilters({ status: 'reviewed' })
 */
export function useListQuery<F extends Record<string, string>>(choices: Choices<F>) {
  const route = useRoute()
  const router = useRouter()
  const keys = Object.keys(choices) as (keyof F & string)[]

  const filters = computed(() => Object.fromEntries(keys.map((key) => {
    const value = route.query[key]
    const allowed = choices[key] as readonly string[]
    return [key, typeof value === 'string' && allowed.includes(value) ? value : allowed[0]]
  })) as F)

  const page = computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value >= 1 && value <= MAX_PAGE ? value : 1
  })

  function go(next: F, nextPage: number, replace = false) {
    const query: Record<string, string> = {}
    for (const key of keys) {
      const value = next[key]
      if (value !== undefined && value !== choices[key][0]) query[key] = value
    }
    if (nextPage > 1) query.page = String(nextPage)
    return replace ? router.replace({ query }) : router.push({ query })
  }

  return {
    filters,
    page,
    setFilters: (changes: Partial<F>) => go({ ...filters.value, ...changes }, 1),
    setPage: (next: number) => go(filters.value, next),
    /** After a load: a page past the end (e.g. its last row was removed) moves to the last page. */
    clampPage: (totalPages: number) => {
      if (page.value > 1 && page.value > totalPages) void go(filters.value, Math.max(1, totalPages), true)
    },
  }
}
