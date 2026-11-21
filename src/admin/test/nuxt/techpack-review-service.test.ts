import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiContractError } from '../../app/api'
import { approveReview, correctDraft, getDraftInspection, getReview, listReviews } from '../../app/features/techpack-review/services/techpack-review.service'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useAPI', () => api)

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

beforeEach(() => {
  api.mockReset()
})

describe('TechPack review service', () => {
  it('lists the queue with the zero-based page and status', async () => {
    api.mockResolvedValueOnce({ success: true, data: { content: [item], totalPages: 3, totalElements: 21 } })

    const res = await listReviews({ status: 'IN_REVIEW', page: 2 })

    expect(api).toHaveBeenCalledWith('admin/docai/techpack-reviews', { query: { status: 'IN_REVIEW', page: 2 }, signal: undefined })
    expect(res).toEqual({ success: true, msg: undefined, data: { content: [expect.objectContaining({ fileId: 101 })], totalPages: 3 } })
  })

  it('fails the whole list when one row lacks a required field', async () => {
    api.mockResolvedValueOnce({ success: true, data: { content: [item, { ...item, fileId: null }], totalPages: 1 } })

    await expect(listReviews({ status: 'IN_REVIEW', page: 0 })).rejects.toThrow(/content\.1\.fileId/)
  })

  it('returns a resolved failure without parsing data', async () => {
    api.mockResolvedValueOnce({ success: false, reason: 'Review not found', data: null })

    expect(await getReview(101)).toEqual({ success: false, reason: 'Review not found', msg: undefined })
  })

  it('refuses a missing fileId before sending anything', async () => {
    await expect(getReview(0)).rejects.toThrow('fileId is required')
    expect(api).not.toHaveBeenCalled()
  })

  it('keeps pdfValue on PDF findings even though the spec omits it', async () => {
    api.mockResolvedValueOnce({ success: true, data: inspection })

    const res = await getDraftInspection(101, item.draftUuid)

    expect(api).toHaveBeenCalledWith('admin/docai/techpack-reviews/101/draft-inspection', {
      query: { draftUuid: item.draftUuid }, signal: undefined,
    })
    if (!res.success) throw new Error('expected success')
    expect(res.data.findings?.[0]?.pdfValue).toBe('52')
    expect(res.data.aiReview?.findings?.[0]?.aiValue).toBe('51')
    expect(res.data.sheets[0]?.rows[0]?.cells).toEqual(['Chest', '50'])
  })

  it('rejects an inspection whose rows have no cells', async () => {
    const broken = { ...inspection, sheets: [{ ...inspection.sheets[0], rows: [{ number: 1, cells: null }] }] }
    api.mockResolvedValueOnce({ success: true, data: broken })

    await expect(getDraftInspection(101, item.draftUuid)).rejects.toBeInstanceOf(ApiContractError)
  })

  it('saves corrections and approves against the current draftUuid', async () => {
    api.mockResolvedValueOnce({ success: true, data: item }).mockResolvedValueOnce({ success: true, data: null })
    const corrections = [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' }]

    await correctDraft(101, item.draftUuid, corrections)
    await approveReview(101, item.draftUuid)

    expect(api).toHaveBeenNthCalledWith(1, 'admin/docai/techpack-reviews/101/draft-corrections', {
      method: 'POST', body: { draftUuid: item.draftUuid, corrections },
    })
    expect(api).toHaveBeenNthCalledWith(2, 'admin/docai/techpack-reviews/101/approve', {
      method: 'POST', body: { draftUuid: item.draftUuid, sourceVerified: true },
    })
  })
})
