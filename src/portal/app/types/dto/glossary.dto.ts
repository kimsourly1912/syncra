import type { BaseRes } from './base.dto'

export type GlossaryUploadStatus = 'PREVIEW' | 'APPLIED' | 'SUPERSEDED' | 'DISCARDED'
export type GlossaryLayer = 'COMPANY_BRAND' | 'COMPANY_WIDE' | 'GLOBAL'
export type GlossarySource = 'GLOSSARY' | 'GENAI'
export type GlossaryIssueSeverity = 'WARNING' | 'BLOCKING'

export interface GlossaryScope {
  companyId: number
  brand: string | null
}

export interface GlossaryCounts {
  added: number
  changed: number
  removed: number
  unchanged: number
}

export interface GlossaryAddedRow {
  normalizedKey: string
  englishText: string
  chineseText: string
}

export interface GlossaryChangedRow {
  normalizedKey: string
  currentEnglishText: string
  currentChineseText: string
  englishText: string
  newChineseText: string
}

export interface GlossaryRemovedRow {
  normalizedKey: string
  englishText: string
  chineseText: string
}

export interface GlossaryIssue {
  severity: GlossaryIssueSeverity
  rowNumbers: number[]
  message: string
}

export interface GlossaryPreview {
  uploadId: number
  scope: GlossaryScope
  originalFilename: string
  createdDate: string
  status: GlossaryUploadStatus
  parsedRowCount: number
  counts: GlossaryCounts
  added: GlossaryAddedRow[]
  changed: GlossaryChangedRow[]
  removed: GlossaryRemovedRow[]
  addedTruncated: boolean
  changedTruncated: boolean
  removedTruncated: boolean
  warnings: GlossaryIssue[]
  blockingErrors: GlossaryIssue[]
  revertedFromUploadId: number | null
  appliedDate: string | null
}

export interface GlossaryEntry {
  normalizedKey: string
  englishText: string
  chineseText: string
  layer: GlossaryLayer
  source: GlossarySource
}

export interface GlossaryPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
  numberOfElements: number
}

export interface GlossaryCompanyParam {
  companyId: number
}

export interface GlossaryUploadParam extends GlossaryCompanyParam {
  uploadId: number
}

export interface GlossaryScopeQuery {
  brand?: string
}

export interface GlossaryEntriesQuery extends GlossaryScopeQuery {
  q?: string
  page: number
  size: number
}

export interface GlossaryHistoryQuery extends GlossaryScopeQuery {
  page: number
  size: number
}

export type GlossaryPreviewRes = BaseRes<GlossaryPreview>
export type GlossaryEntriesRes = BaseRes<GlossaryPage<GlossaryEntry>>
export type GlossaryHistoryRes = BaseRes<GlossaryPage<GlossaryPreview>>

export interface GlossaryDownloadResult {
  blob: Blob
  filename: string
}
