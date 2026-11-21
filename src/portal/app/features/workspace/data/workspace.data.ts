import type { AcceptLiteral } from '~/types/common'
import type { NuxtUIColor } from '~/types/nuxt-ui'
import type { DocAIDTO } from '@/types/dto'

export type ActivityStatus = DocAIDTO.DocAIJobStatus

export interface StatusItem {
  label: string
  icon: string
  color: NuxtUIColor
  border: string
}

export interface ActivityMapItem {
  label: string
  icon: string
  color: NuxtUIColor
}

export interface ActivityItem {
  label: string
  value: AcceptLiteral<ActivityStatus>
}

export interface ModuleItem {
  label: string
  value: AcceptLiteral<DocAIDTO.DocType>
}

export interface ActivityTableData extends DocAIDTO.JobActivityHistoryItem {
  pendingDownload: boolean
}

export const moduleItems: ModuleItem[] = [
  {
    label: 'All Modules',
    value: ' ',
  },
  {
    label: 'Purchase Order',
    value: 'PURCHASE_ORDER',
  },
  {
    label: 'Techpack',
    value: 'TECHPACK',
  },
  {
    label: 'Invoice',
    value: 'INVOICE',
  },
]

export const activityItems: ActivityItem[] = [
  {
    label: 'All Status',
    value: ' ',
  },
  {
    label: 'Completed',
    value: 'COMPLETED',
  },
  {
    label: 'Processing',
    value: 'PROCESSING',
  },
  {
    label: 'Partial Completed',
    value: 'PARTIAL_COMPLETED',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
  {
    label: 'Rejected',
    value: 'REJECTED',
  },
]

export const activityMap = {
  COMPLETED: {
    label: 'Completed',
    color: 'success',
    icon: 'lucide:circle-check',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'info',
    icon: 'lucide:clock',
  },
  FAILED: {
    label: 'Failed',
    color: 'error',
    icon: 'lucide:triangle-alert',
  },
  PARTIAL_COMPLETED: {
    label: 'Partial Completed',
    color: 'warning',
    icon: 'lucide:info',
  },
  DRAFT: {
    label: 'Draft',
    color: 'neutral',
    icon: 'lucide:info',
  },
  PENDING: {
    label: 'Pending',
    color: 'warning',
    icon: 'lucide:loader',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'error',
    icon: 'lucide:triangle-alert',
  },
} satisfies Record<ActivityStatus, ActivityMapItem>

export const statusMap = {
  COMPLETED: {
    label: 'Completed',
    color: 'success',
    icon: 'lucide:circle-check',
    border: tw`border-success`,
  },
  PROCESSING: {
    label: 'Processing',
    color: 'info',
    icon: 'lucide:clock',
    border: tw`border-info`,
  },
  FAILED: {
    label: 'Failed',
    color: 'error',
    icon: 'lucide:triangle-alert',
    border: tw`border-error`,
  },
  PARTIAL_COMPLETED: {
    label: 'Partial Completed',
    color: 'warning',
    icon: 'lucide:info',
    border: tw`border-warning`,
  },
  DRAFT: {
    label: 'Draft',
    color: 'neutral',
    icon: 'lucide:info',
    border: tw`border-inverted`,
  },
  PENDING: {
    label: 'Pending',
    color: 'warning',
    icon: 'lucide:loader',
    border: tw`border-warning`,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'error',
    icon: 'lucide:triangle-alert',
    border: tw`border-error`,
  },
} satisfies Record<ActivityStatus, StatusItem>
