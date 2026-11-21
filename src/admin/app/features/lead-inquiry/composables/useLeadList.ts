import { api } from '@/api'
import { leadPageModel, leadSummaryModel } from '../models/lead'
import type { LeadStatus } from '../models/lead'

/** The status tabs, in the URL as `?status=contacted`. `all` sends no status. */
const STATUS = {
  'all': undefined,
  'new': 'NEW',
  'contacted': 'CONTACTED',
  'converted': 'CONVERTED',
  'not-interested': 'NOT_INTERESTED',
} as const satisfies Record<string, LeadStatus | undefined>

export type LeadStatusTab = keyof typeof STATUS

/** Rows per page. The API's default is 20; its largest page isn't documented (open question). */
export const LEAD_PAGE_SIZES = [20, 50, 100] as const

/**
 * The lead list: status, search, page, and page size in the URL
 * (`/lead-inquiry?status=new&search=acme&page=2&size=50`), plus the totals cards.
 */
export function useLeadList() {
  const list = useListQuery(
    { status: Object.keys(STATUS) as LeadStatusTab[] },
    { search: true, pageSizes: LEAD_PAGE_SIZES },
  )

  const leads = useApiQuery(
    () => `lead-inquiries:list:${list.filters.value.status}:${list.page.value}:${list.pageSize.value}:${list.search.value}`,
    ({ signal }) => api.get('/admin/lead-inquiries', {
      query: {
        status: STATUS[list.filters.value.status],
        search: list.search.value || undefined,
        page: list.page.value - 1, // the API's page is zero-based
        size: list.pageSize.value,
      },
      envelope: false,
      signal,
      model: leadPageModel,
    }),
  )

  const summary = useApiQuery(
    'lead-inquiries:summary',
    ({ signal }) => api.get('/admin/lead-inquiries/summary', { envelope: false, signal, model: leadSummaryModel }),
  )

  // A page past the end (rows changed since the link was made) moves back to the last page.
  watch(() => leads.data.value?.totalPages, (totalPages) => {
    if (totalPages !== undefined) list.clampPage(totalPages)
  })

  return {
    tab: computed(() => list.filters.value.status),
    search: list.search,
    page: list.page,
    pageSize: list.pageSize,
    isFiltered: list.isFiltered,
    items: computed(() => leads.data.value?.items ?? []),
    totalPages: computed(() => leads.data.value?.totalPages ?? 0),
    loading: leads.loading,
    refreshing: leads.refreshing,
    pending: leads.pending,
    error: leads.error,
    refresh: leads.refresh,
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
    showStatus: (status: LeadStatusTab) => list.setFilters({ status }),
    setSearch: list.setSearch,
    showPage: list.setPage,
    setPageSize: list.setPageSize,
    clearFilters: list.clearFilters,
  }
}
