import { api } from '@/api'
import { portalUserPageModel, portalUserSummaryModel } from '../models/portal-user'

/** Rows per page. The API's default is 20; its largest page isn't documented (open question). */
export const ACCOUNT_PAGE_SIZES = [20, 50, 100] as const

/**
 * The portal-user account list: search, page, and page size in the URL
 * (`/?search=acme&page=2&size=50`), plus the totals cards. The API has no onboarding-status
 * filter (open question), so the list has none.
 */
export function useAccountList() {
  const list = useListQuery({}, { search: true, pageSizes: ACCOUNT_PAGE_SIZES })

  const users = useApiQuery(
    () => `accounts:list:${list.page.value}:${list.pageSize.value}:${list.search.value}`,
    ({ signal }) => api.get('/admin/portal-users', {
      query: {
        search: list.search.value || undefined,
        page: list.page.value - 1, // the API's page is zero-based
        size: list.pageSize.value,
      },
      signal,
      model: portalUserPageModel,
    }),
  )

  const summary = useApiQuery(
    'accounts:summary',
    ({ signal }) => api.get('/admin/portal-users/summary', { signal, model: portalUserSummaryModel }),
  )

  // A page past the end (rows changed since the link was made) moves back to the last page.
  watch(() => users.data.value?.totalPages, (totalPages) => {
    if (totalPages !== undefined) list.clampPage(totalPages)
  })

  return {
    search: list.search,
    page: list.page,
    pageSize: list.pageSize,
    isFiltered: list.isFiltered,
    items: computed(() => users.data.value?.items ?? []),
    totalPages: computed(() => users.data.value?.totalPages ?? 0),
    loading: users.loading,
    refreshing: users.refreshing,
    pending: users.pending,
    error: users.error,
    refresh: users.refresh,
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
    setSearch: list.setSearch,
    showPage: list.setPage,
    setPageSize: list.setPageSize,
    clearFilters: list.clearFilters,
  }
}
