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

/** The status tabs in order; the first is the default. */
export const LEAD_STATUS_TABS = Object.keys(STATUS) as LeadStatusTab[]

/**
 * The lead list: status, search, page, and page size in the URL
 * (`/lead-inquiry?status=new&search=acme&page=2&size=50`), plus the status totals.
 *
 * The lead open in the detail panel is `?lead=7`. Opening and closing replace the URL, so Back
 * leaves the list instead of stepping through panels. Changing a filter closes the panel.
 */
export function useLeadList() {
  const leads = useApiList(
    'lead-inquiry:list',
    { status: LEAD_STATUS_TABS },
    { search: true, pageSizes: LIST_PAGE_SIZES },
    ({ filters, query, signal }) => api.get('/admin/lead-inquiries', {
      query: { ...query, status: STATUS[filters.status] },
      signal,
      model: leadPageModel,
    }),
  )

  const summary = useApiQuery(
    'lead-inquiry:summary',
    ({ signal }) => api.get('/admin/lead-inquiries/summary', { signal, model: leadSummaryModel }),
  )

  const panel = useUrlRecord('lead')

  return {
    ...leads,
    tab: computed(() => leads.filters.value.status),
    showStatus: (status: LeadStatusTab) => leads.setFilters({ status }),
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
    openId: panel.id,
    openLead: panel.open,
    closeLead: panel.close,
  }
}
