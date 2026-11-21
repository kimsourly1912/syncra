import type { BaseRes } from '@/types/dto/base.dto'

export interface Item {
  balance: number
  companyId: number
  totalDebited: number
  totalCredited: number
}

export type Data = Item

export type Response = BaseRes<Data>
