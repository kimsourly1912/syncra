import type { BaseRes } from './base.dto'

export interface SubscriptionParam {
  companyId: number
}

export interface SubscriptionData {
  subscriptionId: number
  companyId: number
  moduleId: number
  moduleCode: string
  moduleName: string
  planId: number
  planName: string
  status: string
  startDate: string
  endDate: string
  autoRenew: true
  tokenBalance: number
  tokenQuotaMonthly: number
}

export type SubscriptionRes = BaseRes<SubscriptionData[]>
