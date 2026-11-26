import { api } from '@/api'
import { reviewPageModel } from '../models/review-item'

/**
 * The next TechPack waiting for review after `fileId`: the first open draft on the queue's first
 * In review page. Used after an approval, so the reviewer can go straight on.
 */
export function useNextReview(fileId: number) {
  const query = useApiQuery(
    `techpack-review:next:${fileId}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews', {
      query: { status: 'IN_REVIEW', page: 0 },
      signal,
      model: reviewPageModel,
    }),
  )

  return {
    next: computed(() => query.data.value?.content.find(item => item.draftUuid && item.fileId !== fileId)),
    loading: query.loading,
    error: query.error,
  }
}
