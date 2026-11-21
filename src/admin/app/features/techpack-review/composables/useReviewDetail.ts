import { createInjectionState } from '@vueuse/core'
import type { ReviewFinding } from '../utils/findings'
import { useDraftInspection } from './useDraftInspection'
import { useReview } from './useReview'
import { useReviewActions } from './useReviewActions'
import { useSourcePreview } from './useSourcePreview'
import { useWorkbookReview } from './useWorkbookReview'

const [provideReviewDetail, injectReviewDetail] = createInjectionState((fileId: string) => {
  const route = useRoute()
  const record = useReview(fileId)
  const source = useSourcePreview(record.draft)
  const inspection = useDraftInspection(record.draft)
  const draftUuid = computed(() => record.draft.value?.draftUuid)
  const workbook = useWorkbookReview(draftUuid, inspection.inspection, inspection.findings)
  const actions = useReviewActions(record, source, inspection, workbook)

  useHead({ title: computed(() => `${record.review.value?.filename ?? 'TechPack review'} · Syncra Admin`) })

  return {
    record,
    source,
    inspection,
    workbook,
    actions,
    backLink: computed(() => ({
      path: '/techpack-reviews',
      query: Object.fromEntries(Object.entries(route.query).filter(([key]) => key === 'status' || key === 'page')),
    })),
    showFinding(finding: ReviewFinding) {
      workbook.selectFinding(finding)
      if (finding.sourcePage) source.showPage(finding.sourcePage)
    },
  }
})

export { provideReviewDetail }

export function useReviewDetail() {
  const detail = injectReviewDetail()
  if (!detail) throw new Error('useReviewDetail() needs provideReviewDetail() in ReviewDetailScreen.')
  return detail
}
