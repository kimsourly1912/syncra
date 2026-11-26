import { api } from '@/api'
import { portalUserPageModel, portalUserSummaryModel } from '../models/portal-user'

/**
 * The portal-user account list: search, page, and page size in the URL
 * (`/?search=acme&page=2&size=50`), plus the totals cards. The API has no onboarding-status
 * filter (open question), so the screen shows that filter disabled.
 */
export function useAccountList() {
  const users = useApiList(
    'account:list',
    {},
    { search: true, pageSizes: LIST_PAGE_SIZES },
    ({ query, signal }) => api.get('/admin/portal-users', { query, signal, model: portalUserPageModel }),
  )

  const summary = useApiQuery(
    'account:summary',
    ({ signal }) => api.get('/admin/portal-users/summary', { signal, model: portalUserSummaryModel }),
  )

  return {
    ...users,
    summary: summary.data,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    refreshSummary: summary.refresh,
  }
}
