import { api, errorMessage } from '@/api'
import { reviewPageModel } from '../models/review-item'
import type { ReviewStatus } from '../models/review-item'

const STATUS = {
  'in-review': 'IN_REVIEW',
  'reviewed': 'REVIEWED',
} as const satisfies Record<string, ReviewStatus>

/** The review queue. The status tab and the page live in the URL (`?status=reviewed&page=2`). */
export function useReviewQueue() {
  const route = useRoute()
  const list = useListQuery({ status: ['in-review', 'reviewed'] as const })
  const status = computed(() => STATUS[list.filters.value.status])

  const reviews = useApiQuery(
    () => `techpack-reviews:list:${status.value}:${list.page.value}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews', {
      query: { status: status.value, page: list.page.value - 1 }, // the API's page is zero-based
      signal,
      model: reviewPageModel,
    }),
  )

  // A page past the end (its last review was just approved) moves back to the last page.
  watch(() => reviews.data.value?.totalPages, (totalPages) => {
    if (totalPages !== undefined) list.clampPage(totalPages)
  })

  return {
    status,
    page: list.page,
    /** The list's URL query, kept by links into a review so Back returns here. */
    listQuery: computed(() => route.query),
    items: computed(() => reviews.data.value?.content ?? []),
    totalPages: computed(() => reviews.data.value?.totalPages ?? 0),
    loading: reviews.loading,
    pending: reviews.pending,
    listError: computed(() => (reviews.error.value ? errorMessage(reviews.error.value, 'Could not load TechPack reviews.') : '')),
    refresh: reviews.refresh,
    showStatus: (next: 'in-review' | 'reviewed') => list.setFilters({ status: next }),
    showPage: list.setPage,
  }
}
