import type { BaseRes } from './base.dto'

export type RoleType = 'ADMIN' | 'OPERATOR'

export interface RoleData {
  id: number
  name: string
  code: RoleType
}

export type RoleRes = BaseRes<RoleData[]>
