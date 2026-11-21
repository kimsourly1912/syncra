import { createInjectionState } from '@vueuse/core'
import type { ReviewFinding } from '../utils/findings'
import { useDraftInspection } from './useDraftInspection'
import { useReview } from './useReview'
import { useReviewActions } from './useReviewActions'
import { useSourcePreview } from './useSourcePreview'

/**
 * One TechPack review screen: the record, the source PDF, the draft workbook, and the actions.
 * `ReviewDetailScreen` provides it once; each panel reads the part it shows with `useReviewDetail()`.
 */
const [provideReviewDetail, injectReviewDetail] = createInjectionState((fileIdParam: string) => {
  const route = useRoute()
  const record = useReview(fileIdParam)
  const source = useSourcePreview(record.review)
  const inspection = useDraftInspection(record.review)
  const actions = useReviewActions(record.review, source, inspection)

  useHead({ title: computed(() => `${record.review.value?.filename ?? 'TechPack review'} · Syncra Admin`) })

  return {
    record,
    source,
    inspection,
    actions,
    /** Back to the queue tab and page the review was opened from. */
    backLink: computed(() => ({
      path: '/techpack-reviews',
      query: Object.fromEntries(Object.entries(route.query).filter(([key]) => key === 'status' || key === 'page')),
    })),
    /** Shows a finding in the workbook and its cited page in the PDF. */
    showFinding(finding: ReviewFinding) {
      void inspection.focus(finding)
      if (finding.sourcePage && finding.sourcePage !== source.page.value) source.showPage(finding.sourcePage)
    },
  }
})

export { provideReviewDetail }

export function useReviewDetail() {
  const detail = injectReviewDetail()
  if (!detail) throw new Error('useReviewDetail() needs provideReviewDetail() in ReviewDetailScreen.')
  return detail
}
