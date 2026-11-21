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
})

export type ReviewItem = v.InferOutput<typeof reviewItemModel>
export type ReviewPage = v.InferOutput<typeof reviewPageModel>
