import { api } from '@/api'
import { saleRequestPageModel, saleRequestSummaryModel } from '../models/sale-request'
import type { SaleRequestStatus, SaleRequestType } from '../models/sale-request'

/** The status tabs, in the URL as `?status=pending`. `all` sends no status. */
const STATUS = {
  all: undefined,
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED',
} as const satisfies Record<string, SaleRequestStatus | undefined>

/** The type filter, in the URL as `?type=token`. `all` sends no type. */
const TYPE = {
  all: undefined,
  module: 'MODULE',
  token: 'TOKEN',
  seat: 'SEAT',
} as const satisfies Record<string, SaleRequestType | undefined>

export type SaleRequestStatusTab = keyof typeof STATUS
export type SaleRequestTypeFilter = keyof typeof TYPE

/** Rows per page. The API's default is 20; its largest page isn't documented (open question). */
export const SALE_REQUEST_PAGE_SIZES = [20, 50, 100] as const

/**
 * The sale request list: status, type, search, page, and page size in the URL
 * (`/sale-request?status=pending&type=token&search=acme`), plus the totals cards.
 */
export function useSaleRequestList() {
  const list = useListQuery(
    { status: Object.keys(STATUS) as SaleRequestStatusTab[], type: Object.keys(TYPE) as SaleRequestTypeFilter[] },
    { search: true, pageSizes: SALE_REQUEST_PAGE_SIZES },
  )

  const requests = useApiQuery(
    () => `sale-requests:list:${list.filters.value.status}:${list.filters.value.type}:${list.page.value}:${list.pageSize.value}:${list.search.value}`,
    ({ signal }) => api.get('/admin/sale-requests', {
      query: {
        status: STATUS[list.filters.value.status],
        type: TYPE[list.filters.value.type],
        search: list.search.value || undefined,
        page: list.page.value - 1, // the API's page is zero-based
        size: list.pageSize.value,
      },
      envelope: false,
      signal,
      model: saleRequestPageModel,
    }),
  )

  const summary = useApiQuery(
    'sale-requests:summary',
    ({ signal }) => api.get('/admin/sale-requests/dashboard', { envelope: false, signal, model: saleRequestSummaryModel }),
  )

  // A page past the end (rows changed since the link was made) moves back to the last page.
  watch(() => requests.data.value?.totalPages, (totalPages) => {
    if (totalPages !== undefined) list.clampPage(totalPages)
  })

  return {
    tab: computed(() => list.filters.value.status),
    type: computed(() => list.filters.value.type),
    search: list.search,
    page: list.page,
    pageSize: list.pageSize,
    isFiltered: list.isFiltered,
    items: computed(() => requests.data.value?.items ?? []),
    totalPages: computed(() => requests.data.value?.totalPages ?? 0),
    loading: requests.loading,
    refreshing: requests.refreshing,
    pending: requests.pending,
    error: requests.error,
    refresh: requests.refresh,
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
    showStatus: (status: SaleRequestStatusTab) => list.setFilters({ status }),
    showType: (type: SaleRequestTypeFilter) => list.setFilters({ type }),
    setSearch: list.setSearch,
    showPage: list.setPage,
    setPageSize: list.setPageSize,
    clearFilters: list.clearFilters,
  }
}
