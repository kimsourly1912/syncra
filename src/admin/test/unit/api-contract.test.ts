import { describe, expect, it } from 'vitest'
import { ApiError, defineModel, parseData, vReviewItem } from '../../app/api'

// Sanitized fixture shaped like GET /admin/docai/techpack-reviews/{fileId}.
const reviewItem = {
  fileId: 101,
  jobId: 202,
  companyId: 303,
  filename: 'sample-techpack.xlsx',
  draftUuid: null,
  status: 'IN_REVIEW',
  reviewedByProfileId: null,
  reviewedAt: null,
}

const reviewModel = defineModel(vReviewItem, {
  required: ['fileId', 'status'],
  optional: ['draftUuid'],
})

describe('generated schemas', () => {
  it('accept null and keep int64 ids as numbers', () => {
    const item = parseData(vReviewItem, reviewItem, 'test')
    expect(item.fileId).toBe(101)
    expect(item.draftUuid).toBeNull()
  })
})

describe('defineModel', () => {
  it('keeps only the declared fields', () => {
    expect(parseData(reviewModel, reviewItem, 'test')).toEqual({ fileId: 101, status: 'IN_REVIEW', draftUuid: null })
  })

  it('rejects a required field that is null or missing', () => {
    expect(() => parseData(reviewModel, { ...reviewItem, fileId: null }, 'review')).toThrow(ApiError)
    expect(() => parseData(reviewModel, { status: 'IN_REVIEW' }, 'review')).toThrow(/fileId/)
  })

  it('rejects an unknown enum value in a declared field', () => {
    expect(() => parseData(reviewModel, { ...reviewItem, status: 'ARCHIVED' }, 'review')).toThrow(/status/)
  })
})

describe('parseData', () => {
  it('throws a contract ApiError naming the source and field', () => {
    expect(() => parseData(reviewModel, {}, 'GET admin/docai/techpack-reviews/101'))
      .toThrow('Unexpected response from GET admin/docai/techpack-reviews/101 (fileId:')
    try {
      parseData(reviewModel, {}, 'review')
    }
    catch (error) {
      expect(error).toMatchObject({ kind: 'contract', source: 'review' })
    }
  })
})
