import type { BookkeepingDTO } from '@/types/dto'

export const ENDPOINT = {
  periods: '/bookkeeping/periods',
  period: (id: number) => `/bookkeeping/periods/${id}`,
  periodYears: '/bookkeeping/periods/years',
  statements: (periodId: number) => `/bookkeeping/periods/${periodId}/statements`,
  upload: (periodId: number) => `/bookkeeping/periods/${periodId}/statements`,
  process: (periodId: number, statementId: number) => `/bookkeeping/periods/${periodId}/statements/${statementId}/process`,
  transactions: (periodId: number) => `/bookkeeping/periods/${periodId}/transactions`,
  transaction: (periodId: number, id: number) => `/bookkeeping/periods/${periodId}/transactions/${id}`,
  transactionsSummary: (periodId: number) => `/bookkeeping/periods/${periodId}/transactions/summary`,
  bulkTransactions: (periodId: number) => `/bookkeeping/periods/${periodId}/transactions/bulk-update`,
  categories: '/bookkeeping/categories', // TODO: Implement backend
  templates: '/bookkeeping/templates', // TODO: Implement backend
  export: (periodId: number) => `/bookkeeping/periods/${periodId}/export`,
} as const

// Period CRUD
export function listPeriods(year?: number) {
  return useAPI<BookkeepingDTO.PeriodListRes>(ENDPOINT.periods, {
    method: 'GET',
    query: year ? { year } : undefined,
  })
}

export function listPeriodYears() {
  return useAPI<BookkeepingDTO.YearListRes>(ENDPOINT.periodYears, {
    method: 'GET',
  })
}

export function createPeriod(year: number, month: number) {
  return useAPI<BookkeepingDTO.PeriodRes>(ENDPOINT.periods, {
    method: 'POST',
    body: { year, month },
  })
}

export function getPeriod(periodId: number) {
  return useAPI<BookkeepingDTO.PeriodRes>(ENDPOINT.period(periodId), {
    method: 'GET',
  })
}

export function deletePeriod(periodId: number) {
  return useAPI<void>(ENDPOINT.period(periodId), {
    method: 'DELETE',
  })
}

// Statements
export function listStatements(periodId: number) {
  return useAPI<BookkeepingDTO.StatementListRes>(ENDPOINT.statements(periodId), {
    method: 'GET',
  })
}

export function uploadStatement(periodId: number, file: File, bank?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (bank) formData.append('bank', bank)

  return useAPI<BookkeepingDTO.StatementRes>(ENDPOINT.upload(periodId), {
    method: 'POST',
    body: formData,
  })
}

// ... existing code ...
export function processStatement(periodId: number, statementId: number) {
  return useAPI<BookkeepingDTO.StatementRes>(ENDPOINT.process(periodId, statementId), {
    method: 'POST',
  })
}

export function deleteStatement(periodId: number, statementId: number) {
  return useAPI<unknown>(ENDPOINT.process(periodId, statementId).replace('/process', ''), {
    method: 'DELETE',
  })
}

// Transactions
export function listTransactions(periodId: number, options?: {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}) {
  return useAPI<BookkeepingDTO.TransactionListRes>(ENDPOINT.transactions(periodId), {
    method: 'GET',
    query: options,
  })
}

export function updateTransaction(periodId: number, transactionId: number, data: {
  category?: string
  notes?: string
}) {
  return useAPI<BookkeepingDTO.TransactionUpdateRes>(ENDPOINT.transaction(periodId, transactionId), {
    method: 'PATCH',
    body: data,
  })
}

export function bulkUpdateCategory(periodId: number, transactionIds: number[], category: string) {
  return useAPI<BookkeepingDTO.BulkUpdateRes>(ENDPOINT.bulkTransactions(periodId), {
    method: 'POST',
    body: { transactionIds, category },
  })
}

export function getTransactionSummary(periodId: number) {
  return useAPI<BookkeepingDTO.TransactionSummaryRes>(ENDPOINT.transactionsSummary(periodId), {
    method: 'GET',
  })
}

// Export
export interface ExportExcelFile {
  blob: Blob
  filename: string | null
}

function parseContentDispositionFilename(header: string | null) {
  if (!header)
    return null

  const filenameStarMatch = /filename\*\s*=\s*([^;]+)/i.exec(header)
  if (filenameStarMatch?.[1]) {
    const value = filenameStarMatch[1].trim().replace(/^"|"$/g, '')
    const rfc5987Match = /^([^']*)'[^']*'(.*)$/.exec(value)
    const encoded = rfc5987Match?.[2] ?? value
    try {
      return decodeURIComponent(encoded)
    }
    catch {
      return encoded
    }
  }

  const filenameMatch = /filename\s*=\s*([^;]+)/i.exec(header)
  if (filenameMatch?.[1])
    return filenameMatch[1].trim().replace(/^"|"$/g, '')

  return null
}

export async function exportExcel(periodId: number, template?: string): Promise<ExportExcelFile> {
  const { $api } = useNuxtApp()
  const res = await $api.raw(ENDPOINT.export(periodId), {
    method: 'POST',
    responseType: 'blob',
    query: template ? { template } : undefined,
  })

  return {
    blob: res._data as Blob,
    filename: parseContentDispositionFilename(res.headers.get('content-disposition')),
  }
}

// Categories
export function listCategories() {
  return useAPI<BookkeepingDTO.CategoryListRes>(ENDPOINT.categories, {
    method: 'GET',
  })
}

export function listTemplates() {
  return Promise.resolve({
    data: [
      { id: 'cash_flow', name: 'Cash Flow Report', value: 'CASH_BANK_REPORT', description: 'Standard income/expense report', isCustom: false },
      { id: 'tax_prep', name: 'Tax Preparation', value: 'TAX_PREP', description: 'Categorized for tax filing', isCustom: false },
    ],
    error: null,
  } as unknown as BookkeepingDTO.TemplateListRes)
}
