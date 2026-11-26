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

/**
 * The sale request list: status, type, search, page, and page size in the URL
 * (`/sale-request?status=pending&type=token&search=acme`), plus the status totals.
 *
 * The request open in the detail panel is `?request=5`. Opening and closing replace the URL, so
 * Back leaves the list instead of stepping through panels. Changing a filter closes the panel.
 */
export function useSaleRequestList() {
  const requests = useApiList(
    'sale-request:list',
    { status: Object.keys(STATUS) as SaleRequestStatusTab[], type: Object.keys(TYPE) as SaleRequestTypeFilter[] },
    { search: true, pageSizes: LIST_PAGE_SIZES },
    ({ filters, query, signal }) => api.get('/admin/sale-requests', {
      query: { ...query, status: STATUS[filters.status], type: TYPE[filters.type] },
      signal,
      model: saleRequestPageModel,
    }),
  )

  const summary = useApiQuery(
    'sale-request:summary',
    ({ signal }) => api.get('/admin/sale-requests/dashboard', { signal, model: saleRequestSummaryModel }),
  )

  const panel = useUrlRecord('request')

  return {
    ...requests,
    tab: computed(() => requests.filters.value.status),
    type: computed(() => requests.filters.value.type),
    showStatus: (status: SaleRequestStatusTab) => requests.setFilters({ status }),
    showType: (type: SaleRequestTypeFilter) => requests.setFilters({ type }),
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
    openId: panel.id,
    openRequest: panel.open,
    closeRequest: panel.close,
  }
}
