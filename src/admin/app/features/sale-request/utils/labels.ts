import type { BadgeProps } from '@nuxt/ui'
import type { SaleRequestSource, SaleRequestStatus, SaleRequestType } from '../models/sale-request'

/** How each sale request status reads in a badge. */
export const SALE_REQUEST_STATUS: Record<SaleRequestStatus, { label: string, color: BadgeProps['color'] }> = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'info' },
  REJECTED: { label: 'Rejected', color: 'error' },
  COMPLETED: { label: 'Completed', color: 'success' },
}

/** Each request type's label and icon, so the type reads at a glance in a column of them. */
export const SALE_REQUEST_TYPE: Record<SaleRequestType, { label: string, icon: string }> = {
  MODULE: { label: 'Module', icon: 'lucide:blocks' },
  TOKEN: { label: 'Token', icon: 'lucide:coins' },
  SEAT: { label: 'Seat', icon: 'lucide:users' },
}

export const SALE_REQUEST_SOURCE: Record<SaleRequestSource, string> = {
  CUSTOMER_PORTAL: 'Customer Portal',
  WEBSITE: 'Website',
  INTERNAL_ADMIN: 'Internal Admin',
}
