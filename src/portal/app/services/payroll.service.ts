import type { PayrollDTO } from '@/types/dto'

export const ENDPOINT = {
  payroll: (periodId: number) => `/bookkeeping/periods/${periodId}/payroll`,
  clone: (periodId: number) => `/bookkeeping/periods/${periodId}/payroll/clone`,
  employees: (periodId: number) => `/bookkeeping/periods/${periodId}/payroll/employees`,
  employee: (periodId: number, employeeId: number) => `/bookkeeping/periods/${periodId}/payroll/employees/${employeeId}`,
  export: (periodId: number) => `/bookkeeping/periods/${periodId}/payroll/export?formulaMode=PROGRAMMATIC`,
} as const

// Payroll Record
export function getPayrollRecord(periodId: number) {
  return useAPI<PayrollDTO.PayrollRecordRes>(ENDPOINT.payroll(periodId), {
    method: 'GET',
  })
}

export function createPayrollRecord(periodId: number, exchangeRate: number) {
  return useAPI<PayrollDTO.PayrollRecordRes>(ENDPOINT.payroll(periodId), {
    method: 'POST',
    body: { exchangeRate },
  })
}

export function updateExchangeRate(periodId: number, exchangeRate: number) {
  return useAPI<PayrollDTO.PayrollRecordRes>(ENDPOINT.payroll(periodId), {
    method: 'PUT',
    query: { exchangeRate },
  })
}



export function deletePayrollRecord(periodId: number) {
  return useAPI<void>(ENDPOINT.payroll(periodId), {
    method: 'DELETE',
  })
}

export function clonePayroll(periodId: number, sourcePeriodId: number, exchangeRate: number) {
  return useAPI<PayrollDTO.PayrollRecordRes>(ENDPOINT.clone(periodId), {
    method: 'POST',
    query: { sourcePeriodId, exchangeRate },
  })
}

// Employees
export function addEmployee(periodId: number, employee: PayrollDTO.PayrollEmployeeRequest) {
  return useAPI<PayrollDTO.PayrollEmployeeRes>(ENDPOINT.employees(periodId), {
    method: 'POST',
    body: employee,
  })
}

export function updateEmployee(periodId: number, employeeId: number, employee: PayrollDTO.PayrollEmployeeRequest) {
  return useAPI<PayrollDTO.PayrollEmployeeRes>(ENDPOINT.employee(periodId, employeeId), {
    method: 'PUT',
    body: employee,
  })
}

export function deleteEmployee(periodId: number, employeeId: number) {
  return useAPI<void>(ENDPOINT.employee(periodId, employeeId), {
    method: 'DELETE',
  })
}

// Export
export interface ExportExcelFile {
  blob: Blob
  filename: string | null
}

function parseContentDispositionFilename(header: string | null) {
  if (!header) return null

  const filenameMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  if (filenameMatch?.[1])
    return filenameMatch[1].trim()

  return null
}

export async function exportPayroll(periodId: number): Promise<ExportExcelFile> {
  const { $api } = useNuxtApp()
  const res = await $api.raw(ENDPOINT.export(periodId), {
    method: 'GET',
    responseType: 'blob',
  })

  return {
    blob: res._data as Blob,
    filename: parseContentDispositionFilename(res.headers.get('content-disposition')),
  }
}
