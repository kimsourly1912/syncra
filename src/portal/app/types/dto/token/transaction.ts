import type { BaseRes } from '@/types/dto/base.dto'

export type Status = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
export type Type = 'GRANT' | 'USAGE' | 'REFUND' | 'EXPIRY' | 'ADJUSTMENT' | 'TRANSFER'

export interface Item {
  [x: string]: string
  type: Type
  uuid: string
  email: string
  status: Status
  amount: number
  fullName: string
  imageUrl: string
  moduleName: string
  companyId: string
  createdAt: string
  activityName: string
  description: string
  completedAt: string
  activityDetail: string
  initiatorUserId: string
}

export interface Query {
  type: Type
  direction?: 'RECEIVED'
  to: string
  from: string
  page: number
  size: number
  systemOnly: boolean
  initiatorUserId: number
}

export interface Data {
  items: Item[]
  page: number
  size: number
  totalDebited: number
  totalElements: number
  totalCredited: number
}

export type Response = BaseRes<Data>
