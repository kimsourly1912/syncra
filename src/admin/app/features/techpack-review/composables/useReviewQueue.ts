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
  // The API has a fixed page size and no search.
  const list = useListQuery({ status: ['in-review', 'reviewed'] as const })
  const status = computed(() => STATUS[list.filters.value.status])

  const reviews = useApiQuery(
    () => `techpack-review:list:${status.value}:${list.page.value}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews', {
      query: { status: status.value, page: list.page.value - 1 }, // the API's page is zero-based
      signal,
      model: reviewPageModel,
    }),
  )

  list.keepPageInRange(() => reviews.data.value?.totalPages)

  return {
    tab: computed(() => list.filters.value.status),
    page: list.page,
    /** The list's URL query, kept by links into a review so Back returns here. */
    listQuery: computed(() => route.query),
    items: computed(() => reviews.data.value?.content ?? []),
    totalPages: computed(() => reviews.data.value?.totalPages ?? 0),
    /** Reviews in the current tab across every page; undefined until loaded or when the API leaves it out. */
    total: computed(() => (reviews.loading.value ? undefined : reviews.data.value?.totalElements ?? undefined)),
    loading: reviews.loading,
    refreshing: reviews.refreshing,
    pending: reviews.pending,
    error: reviews.error,
    refresh: reviews.refresh,
    showStatus: (next: ReviewQueueTab) => list.setFilters({ status: next }),
    showPage: list.setPage,
  }
}
