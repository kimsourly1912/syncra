import { api } from '@/api'
import type { ReviewDraft } from '../models/review-item'
import { workbookInspectionModel } from '../models/workbook-inspection'
import { aiReviewFindings, pdfReviewFindings } from '../utils/findings'

/** Fetches and interprets the inspection for the current draft version. */
export function useDraftInspection(draft: Readonly<Ref<ReviewDraft | undefined>>) {
  const query = useApiQuery(
    () => `techpack-review:inspection:${draft.value?.fileId}:${draft.value?.draftUuid}`,
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

  // What approval may rely on: the inspection from the latest load only. When a reload after a
  // save fails, the grid keeps the previous inspection on screen, but it describes a version that
  // no longer exists, so approval treats the inspection as unavailable (compare by hand).
  const current = computed(() => (query.error.value ? null : inspection.value ?? null))

  return {
    inspection,
    /** The inspection approval may rely on: null when the latest load failed. */
    current,
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
    /** The latest load covers the whole workbook, so it counts as checked without a download. */
    complete: computed(() => !!current.value && !current.value.partial && current.value.sheets.some(sheet => sheet.rows.length > 0)),
    blocksApproval: computed(() => !!current.value?.sourceCheck?.blocksApproval || !!current.value?.findings?.length),
  }
}
