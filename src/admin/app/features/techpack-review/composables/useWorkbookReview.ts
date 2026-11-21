import type { WorkbookInspection } from '../models/workbook-inspection'
import { workbookCellKey, stagedCorrections } from '../utils/findings'
import type { ReviewFinding, WorkbookCell } from '../utils/findings'

/** Worksheet navigation and local corrections for a single inspected draft. */
export function useWorkbookReview(
  draftUuid: Readonly<Ref<string | undefined>>,
  inspection: Readonly<Ref<WorkbookInspection | null | undefined>>,
  findings: Readonly<Ref<ReviewFinding[]>>,
) {
  const sheetIndex = ref(0)
  const selection = shallowRef<ReviewFinding>()
  const edits = reactive(new Map<string, string>())

  const sheets = computed(() => inspection.value?.sheets ?? [])
  const sheet = computed(() => sheets.value[sheetIndex.value])
  const flaggedCells = computed(() => new Set(findings.value.map(workbookCellKey)))
  const staged = computed(() => stagedCorrections(findings.value, edits))

  function selectSheet(index: number) {
    sheetIndex.value = index
    selection.value = undefined
  }

  function selectFinding(finding: ReviewFinding) {
    sheetIndex.value = finding.sheetIndex
    // A fresh selection lets a reviewer jump back to the same cell after scrolling away.
    selection.value = { ...finding }
  }

  function findingLocation(finding: ReviewFinding) {
    const target = sheets.value[finding.sheetIndex]
    const column = target?.columns[finding.columnIndex]
    return column ? `${target.name} · ${column}${finding.rowNumber}` : ''
  }

  function originalValue(finding: ReviewFinding) {
    const row = sheets.value[finding.sheetIndex]?.rows.find(row => row.number === finding.rowNumber)
    return finding.workbookValue ?? row?.cells[finding.columnIndex] ?? ''
  }

  function stage(finding: ReviewFinding, value: string) {
    const key = workbookCellKey(finding)
    if (value === originalValue(finding)) edits.delete(key)
    else edits.set(key, value)
  }

  function discardEdits() {
    edits.clear()
  }

  watch(draftUuid, () => {
    discardEdits()
    selectSheet(0)
  })

  watch(inspection, (current) => {
    if (current && !current.sheets[sheetIndex.value]) selectSheet(0)
    else selection.value = undefined
  })

  return {
    sheets,
    sheet,
    sheetIndex: readonly(sheetIndex),
    selection: readonly(selection),
    flaggedCells,
    edits: readonly(edits),
    staged,
    selectSheet,
    selectFinding,
    findingLocation,
    originalValue,
    stage,
    undo: (cell: WorkbookCell) => edits.delete(workbookCellKey(cell)),
    discardEdits,
  }
}
