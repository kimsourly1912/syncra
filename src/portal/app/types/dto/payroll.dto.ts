import type { BaseRes } from './base.dto'

// Status types
export type PayrollStatus = 'DRAFT' | 'COMPLETED'
export type EmployeeType = 'RESIDENT' | 'NON_RESIDENT'

// Payroll Record
export interface PayrollRecord {
  id: number
  periodId: number
  status: PayrollStatus
  exchangeRate: number | null
  employeeCount: number
  employees: PayrollEmployee[]
}

// Payroll Employee
export interface PayrollEmployee {
  id: number
  rowNumber: number

  // Employee Info
  employeeId: string | null
  name: string | null
  nationality: string | null
  employeeType: EmployeeType | null
  function: string | null

  // Salary Components
  basicSalary: number | null
  overtime: number | null
  commission: number | null
  thirteenthSalary: number | null

  // Allowances
  spouseCount: number | null
  minorChildrenCount: number | null

  // Payroll Splits
  firstPayroll: number | null
  secondPayroll: number | null
  pensionFund: number | null

  remarks: string | null
}

// Request types
export interface CreatePayrollRequest {
  exchangeRate: number
}

export interface PayrollEmployeeRequest {
  employeeId?: string
  name?: string
  nationality?: string
  employeeType?: EmployeeType
  function?: string
  basicSalary?: number
  overtime?: number
  commission?: number
  thirteenthSalary?: number
  spouseCount?: number
  minorChildrenCount?: number
  firstPayroll?: number
  secondPayroll?: number
  pensionFund?: number
  remarks?: string
}

// Response types
export type PayrollRecordRes = BaseRes<PayrollRecord>
export type PayrollEmployeeRes = BaseRes<PayrollEmployee>
export type PayrollEmployeeListRes = BaseRes<PayrollEmployee[]>
