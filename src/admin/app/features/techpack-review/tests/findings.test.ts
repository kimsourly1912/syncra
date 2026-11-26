import { describe, expect, it } from 'vitest'
import { aiReviewFindings, draftFileName, workbookCellKey, findingColumn, pdfReviewFindings, stagedCorrections } from '../utils/findings'
import type { WorkbookInspection } from '../models/workbook-inspection'

// Sanitized inspection shaped like the parsed draft-inspection model.
const inspection: WorkbookInspection = {
  partial: false,
  sheets: [
    { name: 'Measurements', columns: ['A', 'B'], rows: [{ number: 1, cells: ['Chest', '50'] }], gridHeaderRow: null },
    { name: 'Grading', columns: ['A', 'B'], rows: [{ number: 4, cells: ['Waist', '30'] }], gridHeaderRow: 1 },
  ],
  findings: [{ rowNumber: 1, columnIndex: 1, column: 'M', pdfValue: '52', workbookValue: '50' }],
  aiReview: { findings: [{ sheetIndex: 1, rowNumber: 4, columnIndex: 1, column: 'Tol +/-', aiValue: '31' }] },
}

describe('review findings', () => {
  it('puts PDF findings on the first sheet with the PDF value as reference', () => {
    expect(pdfReviewFindings(inspection)).toEqual([
      expect.objectContaining({ sheetIndex: 0, origin: 'pdf', referenceValue: '52', rowNumber: 1, columnIndex: 1 }),
    ])
  })

  it('keeps the AI finding sheet and uses the AI value as reference', () => {
    expect(aiReviewFindings(inspection)).toEqual([
      expect.objectContaining({ sheetIndex: 1, origin: 'ai', referenceValue: '31' }),
    ])
  })

  it('returns no findings without an inspection', () => {
    expect(pdfReviewFindings(null)).toEqual([])
    expect(aiReviewFindings(null)).toEqual([])
  })

  it('labels size and tolerance columns', () => {
    expect(findingColumn({ column: 'M' })).toBe('Size M')
    expect(findingColumn({ column: 'Tol +/-' })).toBe('Tol +/-')
  })
})

describe('staged corrections', () => {
  it('turns inline edits into corrections in findings order, keyed per sheet', () => {
    const findings = [...pdfReviewFindings(inspection), ...aiReviewFindings(inspection)]
    const edits = new Map([[workbookCellKey(findings[1]!), '31'], [workbookCellKey(findings[0]!), '52']])

    expect(stagedCorrections(findings, edits)).toEqual([
      { sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' },
      { sheetIndex: 1, rowNumber: 4, columnIndex: 1, value: '31' },
    ])
  })

  it('ignores edits that match no finding', () => {
    const findings = pdfReviewFindings(inspection)
    expect(stagedCorrections(findings, new Map([['9-9-9', 'x']]))).toEqual([])
  })
})

describe('draft file name', () => {
  it('names the draft after the source file', () => {
    expect(draftFileName('sample-techpack.pdf')).toBe('sample-techpack.xlsx')
    expect(draftFileName('no-extension')).toBe('no-extension.xlsx')
  })
})
