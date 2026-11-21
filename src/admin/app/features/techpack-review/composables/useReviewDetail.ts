import { ApiError, errorMessage } from '@/api'
import type { ReviewItem } from '../models/review-item'
import type { SourcePreview, WorkbookInspection, WorkbookRow } from '../models/workbook-inspection'
import * as reviewService from '../services/techpack-review.service'
import { aiReviewFindings, cellKey, draftFileName, editKey, pdfReviewFindings, stagedCorrections } from '../utils/findings'
import type { ReviewFinding } from '../utils/findings'

function logContractError(error: unknown) {
  if (ApiError.from(error).kind === 'contract') console.error(error)
}

/**
 * One TechPack review: source PDF preview, draft workbook inspection, corrections, and approval.
 * Saves and approval use the current `draftUuid`. Any draft change clears the attestation.
 */
export function useReviewDetail(fileIdParam: string) {
  const route = useRoute()
  const toast = useToast()

  const backLink = computed(() => ({
    path: '/techpack-reviews',
    query: typeof route.query.page === 'string' ? { page: route.query.page } : {},
  }))
  const loadingReview = ref(true)
  const pageError = ref('')
  const busy = ref(false)
  const reviewError = ref('')
  const selected = ref<ReviewItem | null>(null)
  const replacement = shallowRef<File | null>(null)
  const workbookInput = ref<HTMLInputElement | null>(null)
  const confirmed = ref(false)
  const draftAccessed = ref(false)
  const sourceDownloaded = ref(false)
  const message = ref('')
  const source = shallowRef<SourcePreview | null>(null)
  const sourcePage = ref(1)
  const sourceZoom = ref(100)
  const sourceViewport = ref<HTMLElement | null>(null)
  const sourceLoading = ref(false)
  const sourceError = ref('')
  const inspection = shallowRef<WorkbookInspection | null>(null)
  const inspectionLoading = ref(false)
  const inspectionError = ref('')
  const sheetIndex = ref(0)
  const activeCell = ref('')
  const inlineEdits = reactive(new Map<string, string>())
  const gridViewport = ref<HTMLElement | null>(null)
  const reviewRequest = new AbortController()
  let disposed = false
  let sourceRequest: AbortController | undefined
  let inspectionRequest: AbortController | undefined

  useHead({ title: computed(() => selected.value ? selected.value.filename + ' · Syncra Admin' : 'TechPack review · Syncra Admin') })

  const sheet = computed(() => inspection.value?.sheets[sheetIndex.value])
  const pdfFindings = computed(() => pdfReviewFindings(inspection.value))
  const aiFindings = computed(() => aiReviewFindings(inspection.value))
  const findings = computed(() => [...pdfFindings.value, ...aiFindings.value])
  const activeFinding = computed(() => findings.value.find(finding =>
    finding.sheetIndex === sheetIndex.value && cellKey(finding.rowNumber, finding.columnIndex) === activeCell.value,
  ))
  const stagedEdits = computed(() => stagedCorrections(findings.value, inlineEdits))
  const flaggedCells = computed(() => new Set(findings.value.filter(finding => finding.sheetIndex === sheetIndex.value)
    .map(finding => cellKey(finding.rowNumber, finding.columnIndex))))
  const checkedGrid = computed(() => inspection.value?.sheets.some(item => item.gridHeaderRow != null))
  const sourceAccessed = computed(() => sourceDownloaded.value || (!!source.value && !sourceError.value))
  const pdfBlocksApproval = computed(() => inspection.value?.sourceCheck?.blocksApproval || pdfFindings.value.length > 0)
  const canConfirm = computed(() => !busy.value && sourceAccessed.value && draftAccessed.value
    && !inspectionLoading.value && !pdfBlocksApproval.value && !replacement.value && !stagedEdits.value.length)

  async function loadReview() {
    loadingReview.value = true
    pageError.value = ''
    try {
      if (!/^[1-9]\d*$/.test(fileIdParam)) {
        pageError.value = 'This TechPack review could not be found.'
        return
      }
      const data = await reviewService.getReview(Number(fileIdParam), reviewRequest.signal)
      if (disposed) return
      selected.value = data
      if (data.draftUuid) {
        void loadSource(1)
        void loadInspection(data)
      }
    }
    catch (error) {
      if (!disposed) pageError.value = errorMessage(error, 'Could not open the TechPack review.')
    }
    finally {
      if (!disposed) loadingReview.value = false
    }
  }

  async function loadSource(page: number) {
    const item = selected.value
    if (!item) return
    sourceRequest?.abort()
    const request = new AbortController()
    sourceRequest = request
    sourceError.value = ''
    sourceLoading.value = true
    try {
      const data = await reviewService.getSourcePreview(item.fileId, page, request.signal)
      if (request.signal.aborted) return
      source.value = data
      sourcePage.value = page
      sourceViewport.value?.scrollTo(0, 0)
    }
    catch (error) {
      logContractError(error)
      if (!request.signal.aborted) sourceError.value = 'PDF preview unavailable. Download the source PDF to compare it.'
    }
    finally {
      if (!request.signal.aborted) sourceLoading.value = false
    }
  }

  async function loadInspection(item: ReviewItem) {
    const { draftUuid } = item
    if (!draftUuid) return
    inspectionRequest?.abort()
    const request = new AbortController()
    inspectionRequest = request
    inspection.value = null
    inspectionError.value = ''
    draftAccessed.value = false
    inspectionLoading.value = true
    selectSheet(0)
    try {
      const data = await reviewService.getDraftInspection(item.fileId, draftUuid, request.signal)
      if (request.signal.aborted) return
      inspection.value = data
      draftAccessed.value ||= !data.partial && data.sheets.some(item => item.rows.length > 0)
    }
    catch (error) {
      logContractError(error)
      if (!request.signal.aborted) inspectionError.value = 'Workbook preview unavailable. Download the workbook to review it.'
    }
    finally {
      if (!request.signal.aborted) inspectionLoading.value = false
    }
  }

  function selectSheet(index: number) {
    sheetIndex.value = index
    activeCell.value = ''
    gridViewport.value?.scrollTo(0, 0)
  }

  function findingLocation(finding: ReviewFinding) {
    const target = inspection.value?.sheets[finding.sheetIndex]
    return `${target?.name} · ${target?.columns[finding.columnIndex]}${finding.rowNumber}`
  }

  function stageValue(finding: ReviewFinding, value: string) {
    const key = editKey(finding)
    if (value === (finding.workbookValue ?? '')) inlineEdits.delete(key)
    else inlineEdits.set(key, value)
    confirmed.value = false
    reviewError.value = ''
    message.value = ''
  }

  function undoValue(finding: ReviewFinding) {
    stageValue(finding, finding.workbookValue ?? '')
  }

  function useAllPdfValues() {
    for (const finding of pdfFindings.value) stageValue(finding, finding.referenceValue)
  }

  function displayCell(row: WorkbookRow, column: number) {
    const key = cellKey(row.number, column)
    const staged = inlineEdits.get(editKey({ sheetIndex: sheetIndex.value, rowNumber: row.number, columnIndex: column }))
    return (staged ?? row.cells[column]) || (flaggedCells.value.has(key) ? 'Blank' : '')
  }

  async function showFinding(finding: ReviewFinding) {
    if (sheetIndex.value !== finding.sheetIndex) selectSheet(finding.sheetIndex)
    if (finding.sourcePage && (sourceLoading.value || sourcePage.value !== finding.sourcePage)) void loadSource(finding.sourcePage)
    const key = cellKey(finding.rowNumber, finding.columnIndex)
    activeCell.value = key
    await nextTick()
    const cell = gridViewport.value?.querySelector<HTMLElement>(`[data-cell="${key}"]`)
    cell?.scrollIntoView({ block: 'nearest', inline: 'center' })
    cell?.focus({ preventScroll: true })
  }

  async function download(kind: 'source' | 'draft') {
    const item = selected.value
    const draftUuid = item?.draftUuid
    if (!item || !draftUuid) return
    busy.value = true
    reviewError.value = ''
    try {
      const blob = await reviewService.downloadReviewFile(item.fileId, kind, draftUuid)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = kind === 'source' ? item.filename : draftFileName(item.filename)
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      if (kind === 'source') sourceDownloaded.value = true
      else draftAccessed.value = true
    }
    catch (error) {
      reviewError.value = errorMessage(error, 'Could not download the file. Reload the queue and try again.')
    }
    finally {
      busy.value = false
    }
  }

  function chooseReplacement(event: Event) {
    replacement.value = (event.target as HTMLInputElement).files?.[0] ?? null
    confirmed.value = false
  }

  async function saveReplacement() {
    const item = selected.value
    const draftUuid = item?.draftUuid
    const workbook = replacement.value
    if (!item || !draftUuid || !workbook || stagedEdits.value.length || busy.value) return
    await saveDraft(() => reviewService.replaceDraft(item.fileId, draftUuid, workbook))
  }

  async function saveInlineCorrections() {
    const item = selected.value
    const draftUuid = item?.draftUuid
    if (!item || !draftUuid || !stagedEdits.value.length || replacement.value || busy.value) return
    const corrections = stagedEdits.value
    await saveDraft(() => reviewService.correctDraft(item.fileId, draftUuid, corrections))
  }

  async function saveDraft(request: () => Promise<ReviewItem>) {
    busy.value = true
    reviewError.value = ''
    try {
      const data = await request()
      if (disposed) return
      selected.value = data
      inlineEdits.clear()
      replacement.value = null
      if (workbookInput.value) workbookInput.value.value = ''
      confirmed.value = false
      message.value = 'Corrected workbook saved. Verify this version against the PDF before approving.'
      await loadInspection(data)
    }
    catch (error) {
      reviewError.value = errorMessage(error, 'Could not save the corrected workbook.')
    }
    finally {
      busy.value = false
    }
  }

  async function approve() {
    const item = selected.value
    const draftUuid = item?.draftUuid
    if (!item || !draftUuid || !confirmed.value || !canConfirm.value) return
    busy.value = true
    reviewError.value = ''
    try {
      await reviewService.approveReview(item.fileId, draftUuid)
      if (disposed) return
      toast.add({ title: 'Workbook reviewed and released.', color: 'success', icon: 'lucide:circle-check' })
      await navigateTo({ path: '/techpack-reviews', query: { status: 'reviewed' } }, { replace: true })
    }
    catch (error) {
      reviewError.value = errorMessage(error, 'Could not approve the workbook.')
    }
    finally {
      busy.value = false
    }
  }

  onMounted(loadReview)
  onBeforeUnmount(() => {
    disposed = true
    reviewRequest.abort()
    sourceRequest?.abort()
    inspectionRequest?.abort()
  })

  return {
    // state
    backLink,
    loadingReview,
    pageError,
    busy,
    reviewError,
    selected,
    replacement,
    confirmed,
    message,
    source,
    sourcePage,
    sourceZoom,
    sourceLoading,
    sourceError,
    inspection,
    inspectionLoading,
    inspectionError,
    sheetIndex,
    activeCell,
    inlineEdits,
    sheet,
    pdfFindings,
    aiFindings,
    findings,
    activeFinding,
    stagedEdits,
    flaggedCells,
    checkedGrid,
    pdfBlocksApproval,
    canConfirm,
    // template refs
    workbookInput,
    sourceViewport,
    gridViewport,
    // actions
    loadSource,
    selectSheet,
    findingLocation,
    stageValue,
    undoValue,
    useAllPdfValues,
    displayCell,
    showFinding,
    download,
    chooseReplacement,
    saveReplacement,
    saveInlineCorrections,
    approve,
  }
}
