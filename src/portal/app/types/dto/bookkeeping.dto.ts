import type { BaseRes, PageRes } from './base.dto'

// Status types
export type PeriodStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'EXPORTED'
export type StatementStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER'

// Period
export interface Period {
  id: number
  year: number
  month: number
  label: string
  status: PeriodStatus
  openingBalance: number | null
  closingBalance: number | null
  totalCredit: number | null
  totalDebit: number | null
  netChange: number | null
  statementCount: number
  transactionCount: number
  createdDate: string
  lastModifiedDate: string
}

export type PeriodListRes = BaseRes<Period[]>
export type PeriodRes = BaseRes<Period>
export type YearListRes = BaseRes<number[]>

// Bank Statement
export interface BankStatement {
  id: number
  periodId: number
  fileId: string
  fileName: string
  bank: string | null
  status: StatementStatus
  transactionCount: number
  openingBalance: number | null
  closingBalance: number | null
  errorMessage: string | null
  createdDate: string
}

export type StatementListRes = BaseRes<BankStatement[]>
export type StatementRes = BaseRes<BankStatement>

// Transaction
export interface Transaction {
  id: number
  periodId: number
  statementId: number
  date: string
  description: string
  reference: string | null
  counterparty: string | null
  transactionType: TransactionType
  credit: number | null
  debit: number | null
  balance: number | null
  category: string | null
  isCategorized: boolean
  notes: string | null
  isDuplicate: boolean
  createdDate: string
}

export type TransactionListRes = BaseRes<PageRes<Transaction>>
export type TransactionRes = BaseRes<Transaction>

// Upload Job
export interface UploadJobData {
  jobId: string
  statementId: number
  estimatedSeconds: number
}

export type UploadJobRes = BaseRes<UploadJobData>

export interface JobStatusData {
  jobId: string
  status: JobStatus
  progress: number
  errorMessage: string | null
}

export type JobStatusRes = BaseRes<JobStatusData>

// Transactions
export type TransactionUpdateRes = BaseRes<Transaction>

// Categories
export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  isCustom: boolean
}

export type CategoryListRes = BaseRes<Category[]>

// Excel Templates
export interface ExcelTemplate {
  id: string
  name: string
  description: string
  value: string
  isCustom: boolean
}

export type TemplateListRes = BaseRes<ExcelTemplate[]>
// Bulk Update
export interface BulkUpdateRes {
  updated: number
}

export interface TransactionSummary {
  totalCount: number
  uncategorizedCount: number
  totalCredit: number | null
  totalDebit: number | null
  netChange: number | null
}

export type TransactionSummaryRes = BaseRes<TransactionSummary>

// Export
export interface ExportData {
  status: string
}

export type ExportRes = BaseRes<ExportData>
