import * as v from 'valibot'
import { parseEnvelope } from '@/api'
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

export async function listReviews(query: ReviewListQuery, signal?: AbortSignal) {
  const endpoint = reviewEndpoint()
  const res = await useAPI<Api.ResponseMsgPageReviewItem>(endpoint, { query, signal })
  return parseEnvelope(res, reviewPageModel, `GET ${endpoint}`)
}

export async function getReview(fileId: number, signal?: AbortSignal) {
  const endpoint = fileEndpoint(fileId)
  const res = await useAPI<Api.ResponseMsgReviewItem>(endpoint, { signal })
  return parseEnvelope(res, reviewItemModel, `GET ${endpoint}`)
}

export async function getSourcePreview(fileId: number, page: number, signal?: AbortSignal) {
  const endpoint = fileEndpoint(fileId, ['source-preview'])
  const res = await useAPI<Api.ResponseMsgTechPackSourcePreview>(endpoint, { query: { page }, signal })
  return parseEnvelope(res, sourcePreviewModel, `GET ${endpoint}`)
}

export async function getDraftInspection(fileId: number, draftUuid: string, signal?: AbortSignal) {
  const endpoint = fileEndpoint(fileId, ['draft-inspection'])
  const res = await useAPI<Api.ResponseMsgTechPackWorkbookInspection>(endpoint, { query: { draftUuid }, signal })
  return parseEnvelope(res, workbookInspectionModel, `GET ${endpoint}`)
}

/** The source PDF, or the current draft workbook when `draftUuid` is given. */
export function downloadReviewFile(fileId: number, kind: 'source' | 'draft', draftUuid: string) {
  const endpoint = fileEndpoint(fileId, [kind])
  return useAPI<Blob>(endpoint, {
    query: kind === 'draft' ? { draftUuid } : undefined,
    responseType: 'blob',
  })
}

export async function replaceDraft(fileId: number, draftUuid: string, workbook: File) {
  const endpoint = fileEndpoint(fileId, ['draft'])
  const body = new FormData()
  body.append('workbook', workbook)
  const res = await useAPI<Api.ResponseMsgReviewItem>(endpoint, { method: 'POST', query: { draftUuid }, body })
  return parseEnvelope(res, reviewItemModel, `POST ${endpoint}`)
}

export async function correctDraft(fileId: number, draftUuid: string, corrections: DraftCorrection[]) {
  const endpoint = fileEndpoint(fileId, ['draft-corrections'])
  const body: Api.DraftCorrections = { draftUuid, corrections }
  const res = await useAPI<Api.ResponseMsgReviewItem>(endpoint, { method: 'POST', body })
  return parseEnvelope(res, reviewItemModel, `POST ${endpoint}`)
}

export async function approveReview(fileId: number, draftUuid: string) {
  const endpoint = fileEndpoint(fileId, ['approve'])
  const body: Api.Approval = { draftUuid, sourceVerified: true }
  const res = await useAPI<Api.ResponseMsgVoid>(endpoint, { method: 'POST', body })
  return parseEnvelope(res, v.unknown(), `POST ${endpoint}`)
}
