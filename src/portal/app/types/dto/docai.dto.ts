import type { AcceptLiteral } from '../common'
import type { BaseRes } from './base.dto'

export type DocType = 'TECHPACK' | 'PURCHASE_ORDER' | 'INVOICE' | 'POM_GLOSSARY'
export type DocAIJobStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL_COMPLETED' | 'FAILED' | 'REJECTED'

export interface DocAIParam {
  companyId: number
}

interface BaseDocAIParam {
  jobId: number
  companyId: number
}

export interface JobParam extends DocAIParam {
  jobId: number
}

export interface FileParam extends JobParam {
  fileId: number
}

export interface BrandStylePair {
  brand: string | null
  style: string | null
}

export interface JobSummary {
  brandStyles?: BrandStylePair[] | null
  jobId?: number
  displayId?: number | null
  formattedId?: string | null
  status: DocAIJobStatus
  docType?: DocType | string
  totalPages?: number | null
  totalRequiredCredits?: number | null
  totalEstimatedSeconds?: number | null
  totalSizeBytes?: number | null
  fileCount: number
  finishedDate?: string | null
  progress?: number | null
  errorMessage?: string | null
}

export interface JobFileAttachment {
  role: string
  originalFilename: string
}

export interface JobFile {
  fileId: number
  docType: DocType | string
  originalFilename: string
  attachments?: JobFileAttachment[]
  uploadRequestId?: string | null
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
  sizeBytes: number
  pageCount?: number | null
  requiredCredits?: number | null
  estimatedSeconds?: number | null
  extractedData?: unknown
  outputFileUuid?: string | null
  excelFilename?: string | null
  excelPreviewUrl?: string | null
  excelDownloadUrl?: string | null
}

export interface JobFileResult {
  fileId: number
  docType: DocType | string
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | null
  originalFilename: string
  sizeBytes: number
  extractedData: string | null
  pageCount?: number | null
  creditsCharged?: number | null
  outputFileUuid?: string | null
  excelFilename?: string | null
  excelPreviewUrl?: string | null
  excelDownloadUrl?: string | null
  errorMessage?: string | null
  deleted?: boolean
  verificationPending?: boolean
  sourcePreviewUrl: string | null
  sourceDownloadUrl: string | null
}

export type CreateJobData = JobSummary

export type CreateJobRes = BaseRes<CreateJobData>

export interface StagedJobData {
  job: JobSummary
  files: JobFile[]
}

export type StagedJobRes = BaseRes<StagedJobData>

export interface JobStatusData {
  jobId: number
  status: DocAIJobStatus
  displayId?: number | null
  formattedId?: string | null
  progress: number | null
  errorMessage: string | null
}

export interface ProcessorsData {
  type: DocType
  displayName: string
  description: string
  hasCustomConfig: boolean
}

export type JobStatusRes = BaseRes<JobStatusData>

export interface JobResultData {
  jobId: number
  displayId?: number | null
  status: DocAIJobStatus
  docType: string
  files: JobFileResult[]
  processedBy: string
  fileCount?: number
  totalPages?: number | null
  totalRequiredCredits?: number | null
  totalCreditsCharged?: number | null
  extractionMethod?: 'RULE_BASED' | 'GEMINI' | null
  actualTokens?: number | null
  totalEstimatedSeconds?: number | null
  totalSizeBytes?: number | null
  errorMessage?: string | null
  createdDate?: string | null
  processingStartedDate?: string | null
  finishedDate?: string | null
  processingDurationMs?: number | null
  filesExpireAt?: string | null
  filesDeleted: boolean
  formattedId: string
}

export interface ErpExportData {
  jobId: number
  fileId: number
  filename: string
  erpCompanyId: string
  statusCode: number
  message: string
}

export interface JobActivityHistoryItem {
  verificationPending?: boolean
  downloadableFileCount?: number
  brandStyles?: BrandStylePair[] | null
  jobId: number
  displayId?: number | null
  status: DocAIJobStatus
  docType: string
  totalPages?: number | null
  totalRequiredCredits?: number | null
  totalEstimatedSeconds?: number | null
  totalSizeBytes?: number | null
  fileCount: number
  finishedDate?: string | null
  formattedId: string
}

export interface JobActivityHistoryQuery {
  page: number
  size: number
  search?: string
  sortDirection?: 'DESC' | 'ASC'
  docType?: AcceptLiteral<DocType>
  status?: AcceptLiteral<DocAIJobStatus>
  sortBy?: keyof JobActivityHistoryItem
}

export interface StatusCount {
  pending: number
  processing: number
  completed: number
  partialCompleted: number
  failed: number
  total: number
  rejected: number
}

export interface JobActivityHistoryData {
  jobs: JobActivityHistoryItem[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  statusCounts: StatusCount
}

export type BulkDeleteJobFilesParam = BaseDocAIParam
export type BulkDownloadJobFilesParam = BaseDocAIParam

export type JobResultRes = BaseRes<JobResultData>
export type ErpExportRes = BaseRes<ErpExportData>
export type ProcessorRes = BaseRes<ProcessorsData[]>
export type FinalizeJobRes = BaseRes<JobSummary | JobStatusData | null>
export type BulkDeleteJobFilesRes = BaseRes<string>
export type BulkDownloadJobFilesRes = Blob
export type JobActivityHistoryRes = BaseRes<JobActivityHistoryData>
