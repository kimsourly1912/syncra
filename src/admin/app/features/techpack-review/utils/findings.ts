import type { PdfFinding, WorkbookInspection } from '../models/workbook-inspection'

/** A PDF or AI finding, normalized so the review grid treats both the same way. */
export type ReviewFinding = Omit<PdfFinding, 'pdfValue'> & {
  sheetIndex: number
  origin: 'pdf' | 'ai'
  referenceValue: string
}

export interface StagedCorrection {
  sheetIndex: number
  rowNumber: number
  columnIndex: number
  value: string
}

export function cellKey(row: number, column: number) {
  return `${row}-${column}`
}

export function editKey(finding: Pick<ReviewFinding, 'sheetIndex' | 'rowNumber' | 'columnIndex'>) {
  return finding.sheetIndex + '-' + cellKey(finding.rowNumber, finding.columnIndex)
}

export function findingColumn(finding: Pick<ReviewFinding, 'column'>) {
  return finding.column.toLowerCase().startsWith('tol') ? finding.column : 'Size ' + finding.column
}

// PDF findings always refer to the first sheet.
export function pdfReviewFindings(inspection: WorkbookInspection | null): ReviewFinding[] {
  return (inspection?.findings ?? []).map(finding => ({
    ...finding, sheetIndex: 0, origin: 'pdf', referenceValue: finding.pdfValue,
  }))
}

export function aiReviewFindings(inspection: WorkbookInspection | null): ReviewFinding[] {
  return (inspection?.aiReview?.findings ?? []).map(finding => ({
    ...finding, origin: 'ai', referenceValue: finding.aiValue,
  }))
}

/** Inline edits as draft corrections, in findings order. */
export function stagedCorrections(findings: ReviewFinding[], edits: ReadonlyMap<string, string>): StagedCorrection[] {
  return findings.flatMap((finding) => {
    const value = edits.get(editKey(finding))
    if (value === undefined) return []
    return [{ sheetIndex: finding.sheetIndex, rowNumber: finding.rowNumber, columnIndex: finding.columnIndex, value }]
  })
}

/** The download name of the draft workbook for a source file. */
export function draftFileName(filename: string) {
  return filename.replace(/\.[^.]+$/, '') + '.xlsx'
}
