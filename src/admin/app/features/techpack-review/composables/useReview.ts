import { api, errorMessage } from '@/api'
import type { ReviewDraft } from '../models/review-item'
import { reviewItemModel } from '../models/review-item'

/** The largest id the API accepts (a Java int). */
const MAX_ID = 2147483647

/** Review routes use `fileId`; the record carries the current `draftUuid` (null once reviewed). */
export function useReview(fileIdParam: string) {
  const fileId = /^[1-9]\d*$/.test(fileIdParam) && Number(fileIdParam) <= MAX_ID ? Number(fileIdParam) : 0

  const query = useApiQuery(
    `techpack-reviews:item:${fileId}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, signal, model: reviewItemModel }),
    { enabled: fileId > 0 },
  )

  const draft = computed<ReviewDraft | undefined>(() => {
    const item = query.data.value
    if (!item?.draftUuid || item.status !== 'IN_REVIEW') return
    return { fileId: item.fileId, filename: item.filename, draftUuid: item.draftUuid }
  })

  return {
    review: query.data,
    draft,
    pending: query.pending,
    retry: fileId > 0 ? query.refresh : undefined,
    refresh: query.refresh,
    loading: query.loading,
    error: computed(() => {
      if (!fileId) return 'This TechPack review could not be found.'
      return query.error.value ? errorMessage(query.error.value, 'Could not open the TechPack review.') : ''
    }),
  }
}
