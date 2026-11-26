import { api } from '@/api'
import { reviewPageModel } from '../models/review-item'
import type { ReviewStatus } from '../models/review-item'

const STATUS = {
  'in-review': 'IN_REVIEW',
  'reviewed': 'REVIEWED',
} as const satisfies Record<string, ReviewStatus>

export type ReviewQueueTab = keyof typeof STATUS

/** The review queue. The status tab and the page live in the URL (`?status=reviewed&page=2`). */
export function useReviewQueue() {
  const route = useRoute()
  // The API has a fixed page size and no search, so `query` holds only the page.
  const reviews = useApiList(
    'techpack-review:list',
    { status: Object.keys(STATUS) as ReviewQueueTab[] },
    {},
    ({ filters, query, signal }) => api.get('/admin/docai/techpack-reviews', {
      query: { page: query.page, status: STATUS[filters.status] },
      signal,
      model: reviewPageModel,
    }).then(({ content, ...page }) => ({ ...page, items: content })),
  )

  return {
    tab: computed(() => reviews.filters.value.status),
    page: reviews.page,
    /** The list's URL query, kept by links into a review so Back returns here. */
    listQuery: computed(() => route.query),
    items: reviews.items,
    totalPages: reviews.totalPages,
    /** Reviews in the current tab across every page; undefined until loaded or when the API leaves it out. */
    total: computed(() => (reviews.loading.value ? undefined : reviews.data.value?.totalElements ?? undefined)),
    loading: reviews.loading,
    refreshing: reviews.refreshing,
    pending: reviews.pending,
    error: reviews.error,
    refresh: reviews.refresh,
    showStatus: (next: ReviewQueueTab) => reviews.setFilters({ status: next }),
    showPage: reviews.showPage,
  }
}
