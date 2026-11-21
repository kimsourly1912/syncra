import { api } from '@/api'
import type { ReviewItem } from '../models/review-item'
import { draftFileName } from '../utils/findings'
import type { StagedCorrection } from '../utils/findings'
import type { useDraftInspection } from './useDraftInspection'
import type { useSourcePreview } from './useSourcePreview'

const REVIEW_PATH = '/admin/docai/techpack-reviews/{fileId}'
const VERIFY_AGAIN = 'Verify this version against the PDF before approving.'

/**
 * The reviewer's actions: downloads, saving inline corrections or a replacement workbook, and
 * approval. Saves and approval send the current `draftUuid`. Approval needs the reviewer's
 * attestation, which any change to the draft clears.
 */
export function useReviewActions(
  review: Readonly<Ref<ReviewItem | undefined>>,
  source: ReturnType<typeof useSourcePreview>,
  inspection: ReturnType<typeof useDraftInspection>,
) {
  const router = useRouter()
  const confirmed = ref(false)
  const sourceDownloaded = ref(false)
  const draftDownloaded = ref(false)
  const replacement = shallowRef<File | null>(null)
  const workbookInput = ref<HTMLInputElement | null>(null)

  function clearReplacement() {
    replacement.value = null
    if (workbookInput.value) workbookInput.value.value = ''
  }

  // The attestation covers exactly what's on screen: any change clears it.
  watch(() => review.value?.draftUuid, () => {
    draftDownloaded.value = false
    clearReplacement()
  })
  watch([() => review.value?.draftUuid, inspection.staged, replacement], () => {
    confirmed.value = false
  })

  const download = useApiMutation(
    ({ item, kind }: { item: ReviewItem, kind: 'source' | 'draft' }) => kind === 'source'
      ? api.download(`${REVIEW_PATH}/source`, { path: { fileId: item.fileId } })
      : api.download(`${REVIEW_PATH}/draft`, { path: { fileId: item.fileId }, query: { draftUuid: item.draftUuid! } }),
    { error: 'Could not download the file' },
  )

  const saveCorrections = useApiMutation(
    ({ item, corrections }: { item: ReviewItem, corrections: StagedCorrection[] }) =>
      api.post(`${REVIEW_PATH}/draft-corrections`, { path: { fileId: item.fileId }, body: { draftUuid: item.draftUuid!, corrections } }),
    { success: `Corrections saved. ${VERIFY_AGAIN}`, error: 'Could not save the corrections', invalidate: ['techpack-reviews:item'] },
  )

  const replaceWorkbook = useApiMutation(
    ({ item, workbook }: { item: ReviewItem, workbook: File }) =>
      api.post(`${REVIEW_PATH}/draft`, { path: { fileId: item.fileId }, query: { draftUuid: item.draftUuid! }, body: { workbook } }),
    { success: `Corrected workbook saved. ${VERIFY_AGAIN}`, error: 'Could not save the corrected workbook', invalidate: ['techpack-reviews:item'] },
  )

  const approval = useApiMutation(
    (item: ReviewItem) => api.post(`${REVIEW_PATH}/approve`, { path: { fileId: item.fileId }, body: { draftUuid: item.draftUuid!, sourceVerified: true } }),
    { success: 'Workbook reviewed and released.', error: 'Could not approve the workbook', invalidate: ['techpack-reviews'] },
  )

  const busy = computed(() => download.pending.value || saveCorrections.pending.value || replaceWorkbook.pending.value || approval.pending.value)
  const canConfirm = computed(() => !busy.value
    && (sourceDownloaded.value || source.shown.value)
    && (draftDownloaded.value || inspection.complete.value)
    && !inspection.loading.value
    && !inspection.blocksApproval.value
    && !replacement.value
    && !inspection.staged.value.length)

  /** The open draft, if it can still be changed. */
  const openItem = () => (review.value?.draftUuid ? review.value : undefined)

  return {
    confirmed,
    replacement,
    workbookInput,
    busy,
    canConfirm,

    chooseReplacement(event: Event) {
      replacement.value = (event.target as HTMLInputElement).files?.[0] ?? null
    },

    async download(kind: 'source' | 'draft') {
      const item = openItem()
      if (!item) return
      const result = await download.execute({ item, kind })
      if (!result.ok) return
      saveFile(result.data, kind === 'source' ? item.filename : draftFileName(item.filename))
      if (kind === 'source') sourceDownloaded.value = true
      else draftDownloaded.value = true
    },

    async saveCorrections() {
      const item = openItem()
      const corrections = inspection.staged.value
      if (!item || !corrections.length || replacement.value) return
      if ((await saveCorrections.execute({ item, corrections })).ok) inspection.discardEdits()
    },

    async saveReplacement() {
      const item = openItem()
      const workbook = replacement.value
      if (!item || !workbook || inspection.staged.value.length) return
      if ((await replaceWorkbook.execute({ item, workbook })).ok) clearReplacement()
    },

    async approve() {
      const item = openItem()
      if (!item || !confirmed.value || !canConfirm.value) return
      if ((await approval.execute(item)).ok) await router.replace({ path: '/techpack-reviews', query: { status: 'reviewed' } })
    },
  }
}
