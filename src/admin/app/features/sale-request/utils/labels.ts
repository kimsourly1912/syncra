import type { BadgeProps } from '@nuxt/ui'
import type { SaleRequestSource, SaleRequestStatus, SaleRequestType } from '../models/sale-request'

/** How each sale request status reads in a badge. */
export const SALE_REQUEST_STATUS: Record<SaleRequestStatus, { label: string, color: BadgeProps['color'] }> = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'info' },
  REJECTED: { label: 'Rejected', color: 'error' },
  COMPLETED: { label: 'Completed', color: 'success' },
}

export const SALE_REQUEST_TYPE: Record<SaleRequestType, string> = {
  MODULE: 'Module',
  TOKEN: 'Token',
  SEAT: 'Seat',
}

export const SALE_REQUEST_SOURCE: Record<SaleRequestSource, string> = {
  CUSTOMER_PORTAL: 'Customer Portal',
  WEBSITE: 'Website',
  INTERNAL_ADMIN: 'Internal Admin',
}

/**
 * A submit date for a table cell. The API's date format isn't verified (it may have no time
 * zone), so a value that doesn't parse is shown as sent.
 */
export function formatSubmitDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
