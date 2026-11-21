import type { BaseRes } from './base.dto'

export interface BalanceTokensData {
  companyId: number
  balance: number
  totalCredited: number
  totalDebited: number
}

export type BalanceTokensRes = BaseRes<BalanceTokensData>
