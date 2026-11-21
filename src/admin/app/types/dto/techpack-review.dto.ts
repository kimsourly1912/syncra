export type ReviewStatus = 'IN_REVIEW' | 'REVIEWED'

export interface ReviewItem {
  fileId: number
  jobId: number
  companyId: number
  filename: string
  draftUuid: string | null
  status: ReviewStatus
  reviewedAt: string | null
}
