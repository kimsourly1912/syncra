import type { QueryKey } from './useApiQuery'
import type { ListApiQuery, ListChoices, ListQueryOptions } from './useListQuery'

/** What a list's page model gives: one page of rows, and how many pages there are. */
export interface ListPage<R = unknown> {
  items: R[]
  totalPages: number
}

export interface ApiListRequest<F> {
  /** The filters in the URL, as their URL values (`'new'`); map them to the API's values. */
  filters: F
  /** `page` (zero-based), `size`, and `search` for the request's `query`. */
  query: ListApiQuery
  signal: AbortSignal
}

/**
 * An API-backed list: its filters, search, page, and page size in the URL (`useListQuery`), and
 * the page of rows they select (`useApiQuery`). The query key is `<name>:<the URL state>`, so a
 * filter can't be left out of it, and the request gets the zero-based page ready to send.
 *
 * - The fetcher uses only `filters` and `query`: they're the inputs the key covers. A request that
 *   needs anything else isn't a plain list; build it from `useListQuery` and `useApiQuery`.
 * - Its model returns `{ items, totalPages }`; map another shape in the fetcher.
 * - A page past the end moves to the last page (`keepPageInRange`).
 *
 * @example
 * const leads = useApiList(
 *   'lead-inquiry:list',
 *   { status: LEAD_STATUS_TABS },
 *   { search: true, pageSizes: LIST_PAGE_SIZES },
 *   ({ filters, query, signal }) => api.get('/admin/lead-inquiries', {
 *     query: { ...query, status: STATUS[filters.status] },
 *     signal,
 *     model: leadPageModel,
 *   }),
 * )
 */
export function useApiList<F extends Record<string, string>, P extends ListPage>(
  name: QueryKey,
  choices: ListChoices<F>,
  options: ListQueryOptions,
  fetcher: (request: ApiListRequest<F>) => Promise<P>,
) {
  const list = useListQuery(choices, options)

  const rows = useApiQuery(
    () => `${name}:${list.stateKey.value}` as QueryKey,
    ({ signal }) => fetcher({ filters: list.filters.value, query: list.apiQuery.value, signal }),
  )

  list.keepPageInRange(() => rows.data.value?.totalPages)

  return {
    filters: list.filters,
    search: list.search,
    page: list.page,
    pageSize: list.pageSize,
    pageSizes: list.pageSizes,
    isFiltered: list.isFiltered,
    /** The loaded page as the model returned it, for its other fields (a total). */
    data: rows.data,
    items: computed(() => (rows.data.value?.items ?? []) as P['items']),
    totalPages: computed(() => rows.data.value?.totalPages ?? 0),
    /** Rows are loaded for the current URL state (not the previous filter's, still shown). */
    loaded: computed(() => rows.data.value != null),
    loading: rows.loading,
    refreshing: rows.refreshing,
    pending: rows.pending,
    error: rows.error,
    refresh: rows.refresh,
    setFilters: list.setFilters,
    setSearch: list.setSearch,
    showPage: list.setPage,
    setPageSize: list.setPageSize,
    clearFilters: list.clearFilters,
  }
}
