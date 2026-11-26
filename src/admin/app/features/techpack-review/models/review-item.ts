import * as v from 'valibot'
import { defineModel, vReviewItem } from '@/api'
import type { Api } from '@/api'

export type ReviewStatus = NonNullable<Api.ReviewItem['status']>

// Review routes use fileId; saves and approval use the current draftUuid (null once reviewed).
export const reviewItemModel = defineModel(vReviewItem, {
  required: ['fileId', 'jobId', 'companyId', 'filename', 'status'],
  optional: ['draftUuid', 'reviewedAt'],
})

export const reviewPageModel = v.object({
  content: v.array(reviewItemModel),
  totalPages: v.pipe(v.number(), v.integer()),
  // Reviews in this status across every page, shown as a count only. A missing or malformed
  // total hides the count instead of failing the whole queue.
  totalElements: v.fallback(v.nullish(v.pipe(v.number(), v.integer())), undefined),
})

export type ReviewItem = v.InferOutput<typeof reviewItemModel>

export type ReviewDraft = Pick<ReviewItem, 'fileId' | 'filename'> & { draftUuid: string }
