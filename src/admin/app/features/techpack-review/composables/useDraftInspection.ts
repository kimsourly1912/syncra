import { api } from '@/api'
import type { ReviewDraft } from '../models/review-item'
import { workbookInspectionModel } from '../models/workbook-inspection'
import { aiReviewFindings, pdfReviewFindings } from '../utils/findings'

/** Fetches and interprets the inspection for the current draft version. */
export function useDraftInspection(draft: Readonly<Ref<ReviewDraft | undefined>>) {
  const query = useApiQuery(
    () => `techpack-reviews:inspection:${draft.value?.fileId}:${draft.value?.draftUuid}`,
    ({ signal }) => {
      const current = draft.value
      if (!current) return Promise.resolve(null)
      return api.get('/admin/docai/techpack-reviews/{fileId}/draft-inspection', {
        path: { fileId: current.fileId },
        query: { draftUuid: current.draftUuid },
        signal,
        model: workbookInspectionModel,
      })
    },
    { enabled: () => !!draft.value },
  )
  const inspection = query.data
  const pdfFindings = computed(() => pdfReviewFindings(inspection.value ?? null))
  const aiFindings = computed(() => aiReviewFindings(inspection.value ?? null))

  return {
    inspection,
    pending: query.pending,
    /** Nothing to show yet for this draft version. */
    loading: query.loading,
    /** Reloading with the previous inspection still shown (after a save that kept the draftUuid). */
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
    pdfFindings,
    aiFindings,
    findings: computed(() => [...pdfFindings.value, ...aiFindings.value]),
    complete: computed(() => !!inspection.value && !inspection.value.partial && inspection.value.sheets.some(sheet => sheet.rows.length > 0)),
    blocksApproval: computed(() => !!inspection.value?.sourceCheck?.blocksApproval || pdfFindings.value.length > 0),
  }
}
