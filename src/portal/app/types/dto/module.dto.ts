import type { BaseRes, CreationDate } from './base.dto'

export type ModuleAccessType = 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'

export interface PlanData extends CreationDate {
  id: number
  moduleId: number
  moduleCode: string
  code: string
  name: string
  shortDescription: string
  currency: string
  priceMonthly: number
  priceAnnual: number
  ctaLabel: string
  popular: boolean
  active: boolean
  sortOrder: number
  features: string[]
}

export interface ModuleData extends CreationDate {
  id: number
  code: string
  name: string
  description: string
  iconKey: string
  iconUrl: string
  active: boolean
  sortOrder: number
  plans: PlanData[]
}

export interface ModuleAccessData {
  id: number
  moduleId: number
  enabled: boolean
  moduleCode: string
  moduleName: string
  enabledAt: string
  expiresAt: string
  moduleIconUrl: string
  moduleDescription: string
  accessType: ModuleAccessType
}

export interface ModuleAccessParam {
  companyId: number
}

export interface ModuleQuery {
  activeOnly: boolean
}

export interface ModuleDetailParam {
  id: number
}

export interface MarketingContentData {
  id: number
  moduleId: number
  moduleCode: string
  moduleName: string
  description: string
  coverUrl: string
}

// Response
export type ModuleRes = BaseRes<ModuleData[]>
export type MarketingContentRes = BaseRes<MarketingContentData>
export type ModuleAccessRes = BaseRes<ModuleAccessData[]>
