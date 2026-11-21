import { describe, expect, it } from 'vitest'
import { ApiError } from '../../app/api'
import { approveReview, correctDraft, getDraftInspection, getReview, listReviews } from '../../app/features/techpack-review/services/techpack-review.service'
import { fakeApi, ok, refused } from '../fake-api'

// Sanitized fixtures shaped like the TechPack review endpoints.
const item = {
  fileId: 101,
  jobId: 202,
  companyId: 303,
  filename: 'sample-techpack.pdf',
  draftUuid: '00000000-0000-4000-8000-000000000001',
  status: 'IN_REVIEW',
  reviewedByProfileId: null,
  reviewedAt: null,
}

const inspection = {
  sheets: [{ name: 'Measurements', columns: ['A', 'B'], rows: [{ number: 1, cells: ['Chest', '50'] }], gridHeaderRow: null }],
  findings: [{ rowNumber: 1, columnIndex: 1, measurement: 'Chest', column: 'M', sourcePage: 2, workbookValue: '50', pdfValue: '52' }],
  partial: false,
  sourceCheck: { verified: false, blocksApproval: true, comparedCells: 12, notes: null },
  aiReview: {
    comparedCells: 12,
    notes: [],
    findings: [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, measurement: 'Chest', column: 'M', sourcePage: null, workbookValue: '50', aiValue: '51' }],
  },
}

const REVIEWS = 'admin/docai/techpack-reviews'

describe('TechPack review service', () => {
  it('lists the queue with the zero-based page and status', async () => {
    const { transport } = fakeApi({ [`GET ${REVIEWS}`]: ok({ content: [item], totalPages: 3, totalElements: 21 }) })

    const page = await listReviews({ status: 'IN_REVIEW', page: 2 })

    expect(transport).toHaveBeenCalledWith(REVIEWS, expect.objectContaining({ method: 'GET', query: { status: 'IN_REVIEW', page: 2 } }))
    expect(page).toEqual({ content: [expect.objectContaining({ fileId: 101 })], totalPages: 3 })
  })

  it('fails the whole list when one row lacks a required field', async () => {
    fakeApi({ [`GET ${REVIEWS}`]: ok({ content: [item, { ...item, fileId: null }], totalPages: 1 }) })

    await expect(listReviews({ status: 'IN_REVIEW', page: 0 })).rejects.toThrow(/content\.1\.fileId/)
  })

  it('throws the API reason when the response is success: false', async () => {
    fakeApi({ [`GET ${REVIEWS}/101`]: refused('Review not found') })

    await expect(getReview(101)).rejects.toMatchObject({ kind: 'rejected', message: 'Review not found' })
  })

  it('refuses a missing fileId before sending anything', async () => {
    const { transport } = fakeApi()

    await expect(getReview(0)).rejects.toThrow('fileId is required')
    expect(transport).not.toHaveBeenCalled()
  })

  it('keeps pdfValue on PDF findings even though the spec omits it', async () => {
    const { transport } = fakeApi({ [`GET ${REVIEWS}/101/draft-inspection`]: ok(inspection) })

    const data = await getDraftInspection(101, item.draftUuid)

    expect(transport).toHaveBeenCalledWith(`${REVIEWS}/101/draft-inspection`, expect.objectContaining({ query: { draftUuid: item.draftUuid } }))
    expect(data.findings?.[0]?.pdfValue).toBe('52')
    expect(data.aiReview?.findings?.[0]?.aiValue).toBe('51')
    expect(data.sheets[0]?.rows[0]?.cells).toEqual(['Chest', '50'])
  })

  it('rejects an inspection whose rows have no cells', async () => {
    const broken = { ...inspection, sheets: [{ ...inspection.sheets[0], rows: [{ number: 1, cells: null }] }] }
    fakeApi({ [`GET ${REVIEWS}/101/draft-inspection`]: ok(broken) })

    const error = await getDraftInspection(101, item.draftUuid).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.kind).toBe('contract')
  })

  it('saves corrections and approves against the current draftUuid', async () => {
    const { transport } = fakeApi({
      [`POST ${REVIEWS}/101/draft-corrections`]: ok(item),
      [`POST ${REVIEWS}/101/approve`]: ok(null),
    })
    const corrections = [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' }]

    await correctDraft(101, item.draftUuid, corrections)
    await approveReview(101, item.draftUuid)

    expect(transport).toHaveBeenNthCalledWith(1, `${REVIEWS}/101/draft-corrections`, expect.objectContaining({
      method: 'POST', body: { draftUuid: item.draftUuid, corrections },
    }))
    expect(transport).toHaveBeenNthCalledWith(2, `${REVIEWS}/101/approve`, expect.objectContaining({
      method: 'POST', body: { draftUuid: item.draftUuid, sourceVerified: true },
    }))
  })
})
