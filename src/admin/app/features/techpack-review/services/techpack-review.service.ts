import { api } from '@/api'
import type { Api } from '@/api'
import { reviewItemModel, reviewPageModel } from '../models/review-item'
import type { ReviewStatus } from '../models/review-item'
import { sourcePreviewModel, workbookInspectionModel } from '../models/workbook-inspection'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  docai: 'docai',
  techpackReviews: 'techpack-reviews',
  sourcePreview: 'source-preview',
  draftInspection: 'draft-inspection',
  draftCorrections: 'draft-corrections',
  draft: 'draft',
  source: 'source',
  approve: 'approve',
} as const

type Parts = typeof PARTS

function reviewEndpoint(parts: Array<string | number> = []) {
  return buildEndPoint<Parts>(PREFIX.admin, ['docai', 'techpack-reviews', ...parts])
}

function fileEndpoint(fileId: number, parts: string[] = []) {
  if (fileId <= 0) throw new Error('TechPack review: fileId is required')
  return reviewEndpoint([fileId, ...parts])
}

export interface ReviewListQuery {
  status: ReviewStatus
  page: number
}

export interface DraftCorrection {
  sheetIndex: number
  rowNumber: number
  columnIndex: number
  value: string
}

// Async so that an invalid fileId rejects like any other failure.

export async function listReviews(query: ReviewListQuery, signal?: AbortSignal) {
  return api.get(reviewEndpoint(), { query, signal, model: reviewPageModel })
}

export async function getReview(fileId: number, signal?: AbortSignal) {
  return api.get(fileEndpoint(fileId), { signal, model: reviewItemModel })
}

export async function getSourcePreview(fileId: number, page: number, signal?: AbortSignal) {
  return api.get(fileEndpoint(fileId, ['source-preview']), { query: { page }, signal, model: sourcePreviewModel })
}

export async function getDraftInspection(fileId: number, draftUuid: string, signal?: AbortSignal) {
  return api.get(fileEndpoint(fileId, ['draft-inspection']), { query: { draftUuid }, signal, model: workbookInspectionModel })
}

/** The source PDF, or the current draft workbook when `draftUuid` is given. */
export async function downloadReviewFile(fileId: number, kind: 'source' | 'draft', draftUuid: string) {
  return api.download(fileEndpoint(fileId, [kind]), { query: kind === 'draft' ? { draftUuid } : undefined })
}

export async function replaceDraft(fileId: number, draftUuid: string, workbook: File) {
  const body = new FormData()
  body.append('workbook', workbook)
  return api.post(fileEndpoint(fileId, ['draft']), { query: { draftUuid }, body, model: reviewItemModel })
}

export async function correctDraft(fileId: number, draftUuid: string, corrections: DraftCorrection[]) {
  const body: Api.DraftCorrections = { draftUuid, corrections }
  return api.post(fileEndpoint(fileId, ['draft-corrections']), { body, model: reviewItemModel })
}

export async function approveReview(fileId: number, draftUuid: string) {
  const body: Api.Approval = { draftUuid, sourceVerified: true }
  return api.post(fileEndpoint(fileId, ['approve']), { body })
}
