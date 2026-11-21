import type { PdfFinding, WorkbookInspection } from '../models/workbook-inspection'

export interface WorkbookCell {
  sheetIndex: number
  rowNumber: number
  columnIndex: number
}

/** A finding identifies an observation. Multiple observations can point to the same cell. */
export type ReviewFinding = Omit<PdfFinding, 'pdfValue'> & WorkbookCell & {
  id: string
  origin: 'pdf' | 'ai'
  referenceValue: string
}

export interface StagedCorrection extends WorkbookCell {
  value: string
}

export function workbookCellKey({ sheetIndex, rowNumber, columnIndex }: WorkbookCell) {
  return `${sheetIndex}-${rowNumber}-${columnIndex}`
}

export function findingColumn(finding: Pick<ReviewFinding, 'column'>) {
  return finding.column.toLowerCase().startsWith('tol') ? finding.column : 'Size ' + finding.column
}

// PDF findings always refer to the first sheet.
export function pdfReviewFindings(inspection: WorkbookInspection | null): ReviewFinding[] {
  return (inspection?.findings ?? []).map(({ pdfValue, ...finding }, index) => ({
    ...finding,
    id: `pdf:${index}`,
    sheetIndex: 0,
    origin: 'pdf',
    referenceValue: pdfValue,
  }))
}

export function aiReviewFindings(inspection: WorkbookInspection | null): ReviewFinding[] {
  return (inspection?.aiReview?.findings ?? []).map(({ aiValue, ...finding }, index) => ({
    ...finding,
    id: `ai:${index}`,
    origin: 'ai',
    referenceValue: aiValue,
  }))
}

/** Serializes one correction per cell in findings order, while ignoring edits outside the inspection. */
export function stagedCorrections(findings: ReviewFinding[], edits: ReadonlyMap<string, string>): StagedCorrection[] {
  const corrections = new Map<string, StagedCorrection>()
  for (const { sheetIndex, rowNumber, columnIndex } of findings) {
    const cell = { sheetIndex, rowNumber, columnIndex }
    const key = workbookCellKey(cell)
    const value = edits.get(key)
    if (value !== undefined) corrections.set(key, { ...cell, value })
  }
  return [...corrections.values()]
}

export function draftFileName(filename: string) {
  return filename.replace(/\.[^.]+$/, '') + '.xlsx'
}
