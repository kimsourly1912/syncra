import { api } from '@/api'
import type { ReviewDraft, ReviewItem } from '../models/review-item'
import { draftFileName } from '../utils/findings'
import type { StagedCorrection } from '../utils/findings'
import type { useDraftInspection } from './useDraftInspection'
import type { useReview } from './useReview'
import type { useSourcePreview } from './useSourcePreview'
import type { useWorkbookReview } from './useWorkbookReview'

const REVIEW_PATH = '/admin/docai/techpack-reviews/{fileId}'
const VERIFY_AGAIN = 'Verify this version against the PDF before approving.'

export interface ReviewCheck {
  id: 'source' | 'issues' | 'workbook' | 'saved'
  /** The step no longer holds approval back. */
  done: boolean
  /** Done, but the reviewer should know something is missing. */
  warning?: boolean
  /** Not done yet, and something is loading that will settle it. */
  inProgress?: boolean
  label: string
}

export function useReviewActions(
  record: ReturnType<typeof useReview>,
  source: ReturnType<typeof useSourcePreview>,
  inspection: ReturnType<typeof useDraftInspection>,
  workbook: ReturnType<typeof useWorkbookReview>,
) {
  const confirmed = ref(false)
  // The record as approved in this visit, kept in case reloading it afterwards fails.
  const approvedReview = shallowRef<ReviewItem>()
  const downloading = ref<'source' | 'draft'>()
  const sourceDownloaded = ref(false)
  const draftDownloaded = ref(false)
  const replacement = shallowRef<File | null>(null)
  const draftUuid = computed(() => record.draft.value?.draftUuid)

  watch(draftUuid, () => {
    draftDownloaded.value = false
    replacement.value = null
  })
  watch([draftUuid, workbook.staged, replacement], () => {
    confirmed.value = false
  }, { flush: 'sync' })

  const download = useApiMutation(
    ({ draft, kind }: { draft: ReviewDraft, kind: 'source' | 'draft' }) => kind === 'source'
      ? api.download(`${REVIEW_PATH}/source`, { path: { fileId: draft.fileId } })
      : api.download(`${REVIEW_PATH}/draft`, { path: { fileId: draft.fileId }, query: { draftUuid: draft.draftUuid } }),
    { error: 'Could not download the file' },
  )

  async function reloadAfterSave(previousDraft: ReviewDraft) {
    confirmed.value = false
    draftDownloaded.value = false
    await record.refresh()
    // A changed UUID triggers its own inspection. Refresh explicitly if the UUID was retained.
    if (draftUuid.value === previousDraft.draftUuid && !record.error.value) await inspection.refresh()
  }

  const saveCorrections = useApiMutation(
    async ({ draft, corrections }: { draft: ReviewDraft, corrections: StagedCorrection[] }) => {
      await api.post(`${REVIEW_PATH}/draft-corrections`, {
        path: { fileId: draft.fileId },
        body: { draftUuid: draft.draftUuid, corrections },
      })
      workbook.discardEdits()
      await reloadAfterSave(draft)
    },
    { success: `Corrections saved. ${VERIFY_AGAIN}`, error: 'Could not save the corrections' },
  )

  const replaceWorkbook = useApiMutation(
    async ({ draft, file }: { draft: ReviewDraft, file: File }) => {
      await api.post(`${REVIEW_PATH}/draft`, {
        path: { fileId: draft.fileId },
        query: { draftUuid: draft.draftUuid },
        body: { workbook: file },
      })
      replacement.value = null
      await reloadAfterSave(draft)
    },
    { success: `Corrected workbook saved. ${VERIFY_AGAIN}`, error: 'Could not save the corrected workbook' },
  )

  const approval = useApiMutation(
    (draft: ReviewDraft) => api.post(`${REVIEW_PATH}/approve`, {
      path: { fileId: draft.fileId },
      body: { draftUuid: draft.draftUuid, sourceVerified: true },
    }),
    { success: 'Workbook reviewed and released.', error: 'Could not approve the workbook', invalidate: ['techpack-reviews'] },
  )

  const busy = computed(() => record.pending.value || download.pending.value
    || saveCorrections.pending.value || replaceWorkbook.pending.value || approval.pending.value)

  const approvalBlocker = computed(() => {
    if (busy.value) return 'Wait for the current action to finish.'
    if (workbook.staged.value.length) return 'Save or discard your corrections before approving.'
    if (replacement.value) return 'Save or cancel the workbook replacement before approving.'
    if (inspection.pending.value) return 'Wait for the workbook inspection to finish.'
    if (inspection.blocksApproval.value) {
      return inspection.pdfFindings.value.length
        ? 'Resolve the PDF differences before approving.'
        : 'Resolve the workbook layout issues before approving.'
    }
    if (!sourceDownloaded.value && !source.shown.value) {
      return source.loading.value ? 'Wait for the source PDF to load.' : 'Download the source PDF to verify it.'
    }
    if (!draftDownloaded.value && !inspection.complete.value) return 'Download the full workbook to verify it.'
    return ''
  })

  /**
   * What approval still needs, shown all at once in the footer. Display only: `approvalBlocker`
   * and `canConfirm` decide whether approval is allowed. Each step reads the same state that
   * `approvalBlocker` checks.
   */
  const checklist = computed<ReviewCheck[]>(() => {
    const pdfDifferences = inspection.pdfFindings.value.length
    const sourceDone = sourceDownloaded.value || source.shown.value
    const workbookDone = draftDownloaded.value || inspection.complete.value
    const saved = !workbook.staged.value.length && !replacement.value
    return [
      {
        id: 'source',
        done: sourceDone,
        inProgress: !sourceDone && source.loading.value,
        label: sourceDone ? 'Source PDF opened' : source.loading.value ? 'Source PDF loading' : 'Download the source PDF',
      },
      inspection.pending.value
        ? { id: 'issues', done: false, inProgress: true, label: 'Inspecting workbook' }
        : inspection.blocksApproval.value
          ? {
              id: 'issues',
              done: false,
              label: pdfDifferences
                ? `${pdfDifferences} PDF ${pdfDifferences === 1 ? 'difference' : 'differences'} to resolve`
                : 'Layout issues to resolve',
            }
          : inspection.inspection.value
            ? { id: 'issues', done: true, label: 'No blocking issues' }
            // A failed inspection doesn't block approval, so the reviewer compares by hand.
            : { id: 'issues', done: true, warning: true, label: 'Inspection unavailable: compare by hand' },
      {
        id: 'workbook',
        done: workbookDone,
        label: workbookDone ? 'Full workbook checked' : 'Download the full workbook',
      },
      {
        id: 'saved',
        done: saved,
        label: saved ? 'No unsaved changes' : 'Save or discard your changes',
      },
    ]
  })

  const canConfirm = computed(() => !!record.draft.value && !record.error.value && !approvalBlocker.value)
  const canEdit = computed(() => !busy.value && !inspection.pending.value && !replacement.value)

  return {
    confirmed,
    replacement: readonly(replacement),
    busy,
    canEdit,
    canConfirm,
    approvalBlocker,
    checklist,
    /** Approved in this visit: the screen shows the result while the record reloads as Reviewed. */
    approved: computed(() => !!approvedReview.value),
    approvedReview: readonly(approvedReview),
    /** The file being downloaded, so only its button shows a spinner. */
    downloading: readonly(downloading),
    savingCorrections: saveCorrections.pending,
    savingReplacement: replaceWorkbook.pending,
    approving: approval.pending,

    setReplacement(file: File | null) {
      replacement.value = file
    },

    async download(kind: 'source' | 'draft') {
      const draft = record.draft.value
      if (!draft || busy.value) return
      downloading.value = kind
      const result = await download.execute({ draft, kind }).finally(() => {
        downloading.value = undefined
      })
      if (!result.ok) return
      saveFile(result.data, kind === 'source' ? draft.filename : draftFileName(draft.filename))
      if (kind === 'source') sourceDownloaded.value = true
      else if (draftUuid.value === draft.draftUuid) draftDownloaded.value = true
    },

    async saveCorrections() {
      const draft = record.draft.value
      const corrections = workbook.staged.value
      if (!draft || !canEdit.value || !corrections.length) return
      await saveCorrections.execute({ draft, corrections })
    },

    async saveReplacement() {
      const draft = record.draft.value
      const file = replacement.value
      if (!draft || !file || busy.value || workbook.staged.value.length) return false
      return (await replaceWorkbook.execute({ draft, file })).ok
    },

    async approve() {
      const draft = record.draft.value
      if (!draft || !confirmed.value || !canConfirm.value) return
      const approvedRecord = record.review.value
      if (!(await approval.execute(draft)).ok) return
      approvedReview.value = approvedRecord
      await record.refresh()
    },
  }
}
