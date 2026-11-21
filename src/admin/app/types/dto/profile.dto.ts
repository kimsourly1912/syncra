import type { BaseRes } from '@/types/dto/base.dto'

export type UserStatus
  = | 'UNCONFIRMED'
    | 'CONFIRMED'
    | 'FORCE_CHANGE_PASSWORD'
    | 'RESET_REQUIRED'
    | 'COMPROMISED'
    | 'ARCHIVED'
    | 'UNKNOWN'

export type UserGroup
  = | 'GROUP_COMPANY'
    | 'GROUP_GOOGLE'
    | 'GROUP_FACEBOOK'
    | 'GROUP_APPLE'
    | 'GROUP_COMPANY_STAFF'
    | 'GROUP_SYNCRA_ADMIN'

export interface UserRole {
  id: number
  name: string
  code: string
}

export interface ProfileData {
  id: number
  username: string
  email: string
  logoUrl: string
  group: UserGroup
  role: UserRole
  userStatus: UserStatus
}

export type ProfileRes = BaseRes<ProfileData>
