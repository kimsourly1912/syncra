import { api } from '@/api'
import type { ReviewItem } from '../models/review-item'
import { workbookInspectionModel } from '../models/workbook-inspection'
import type { WorkbookRow } from '../models/workbook-inspection'
import { aiReviewFindings, cellKey, editKey, pdfReviewFindings, stagedCorrections } from '../utils/findings'
import type { ReviewFinding } from '../utils/findings'

/**
 * The current draft workbook: its sheets, the PDF and AI findings, and the reviewer's inline
 * edits (staged until saved). A new draft starts clean.
 */
export function useDraftInspection(review: Readonly<Ref<ReviewItem | undefined>>) {
  const draftUuid = computed(() => review.value?.draftUuid ?? undefined)

  const query = useApiQuery(
    () => `techpack-reviews:inspection:${review.value?.fileId}:${draftUuid.value}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}/draft-inspection', {
      path: { fileId: review.value!.fileId },
      query: { draftUuid: draftUuid.value! },
      signal,
      model: workbookInspectionModel,
    }),
    { enabled: () => !!draftUuid.value },
  )
  const inspection = query.data

  const sheetIndex = ref(0)
  const activeCell = ref('')
  const edits = reactive(new Map<string, string>())
  const gridViewport = ref<HTMLElement | null>(null)

  const pdfFindings = computed(() => pdfReviewFindings(inspection.value ?? null))
  const aiFindings = computed(() => aiReviewFindings(inspection.value ?? null))
  const findings = computed(() => [...pdfFindings.value, ...aiFindings.value])
  const sheet = computed(() => inspection.value?.sheets[sheetIndex.value])
  const activeFinding = computed(() => findings.value.find(finding =>
    finding.sheetIndex === sheetIndex.value && cellKey(finding.rowNumber, finding.columnIndex) === activeCell.value,
  ))
  const staged = computed(() => stagedCorrections(findings.value, edits))
  const flaggedCells = computed(() => new Set(findings.value.filter(finding => finding.sheetIndex === sheetIndex.value)
    .map(finding => cellKey(finding.rowNumber, finding.columnIndex))))

  function selectSheet(index: number) {
    sheetIndex.value = index
    activeCell.value = ''
    gridViewport.value?.scrollTo(0, 0)
  }

  watch(draftUuid, () => {
    edits.clear()
    selectSheet(0)
  })

  function stage(finding: ReviewFinding, value: string) {
    if (value === (finding.workbookValue ?? '')) edits.delete(editKey(finding))
    else edits.set(editKey(finding), value)
  }

  /** Selects a finding's cell and scrolls it into view. */
  async function focus(finding: ReviewFinding) {
    if (sheetIndex.value !== finding.sheetIndex) selectSheet(finding.sheetIndex)
    const key = cellKey(finding.rowNumber, finding.columnIndex)
    activeCell.value = key
    await nextTick()
    const cell = gridViewport.value?.querySelector<HTMLElement>(`[data-cell="${key}"]`)
    cell?.scrollIntoView({ block: 'nearest', inline: 'center' })
    cell?.focus({ preventScroll: true })
  }

  return {
    inspection,
    loading: query.pending,
    error: computed(() => (query.error.value ? 'Workbook preview unavailable. Download the workbook to review it.' : '')),
    /** The whole workbook was shown: counts toward "draft accessed". */
    complete: computed(() => !!inspection.value && !inspection.value.partial && inspection.value.sheets.some(item => item.rows.length > 0)),
    sheetIndex,
    sheet,
    activeCell,
    gridViewport,
    edits,
    staged,
    pdfFindings,
    aiFindings,
    findings,
    activeFinding,
    flaggedCells,
    /** Some sheet was checked against the size grid, so "no checks" on another sheet is worth saying. */
    checkedGrid: computed(() => inspection.value?.sheets.some(item => item.gridHeaderRow != null) ?? false),
    blocksApproval: computed(() => !!inspection.value?.sourceCheck?.blocksApproval || pdfFindings.value.length > 0),
    selectSheet,
    stage,
    undo: (finding: ReviewFinding) => stage(finding, finding.workbookValue ?? ''),
    useAllPdfValues: () => pdfFindings.value.forEach(finding => stage(finding, finding.referenceValue)),
    discardEdits: () => edits.clear(),
    findingLocation: (finding: ReviewFinding) => {
      const target = inspection.value?.sheets[finding.sheetIndex]
      return `${target?.name} · ${target?.columns[finding.columnIndex]}${finding.rowNumber}`
    },
    displayCell: (row: WorkbookRow, column: number) => {
      const value = edits.get(editKey({ sheetIndex: sheetIndex.value, rowNumber: row.number, columnIndex: column }))
      return (value ?? row.cells[column]) || (flaggedCells.value.has(cellKey(row.number, column)) ? 'Blank' : '')
    },
    focus,
  }
}
