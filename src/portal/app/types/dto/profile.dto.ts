import type { BaseRes } from './base.dto'
import type { RoleData } from './role.dto'
import type { SubscriptionData } from './subscription.dto'
import type { BalanceDto } from './token'
import type { RepresentiveData, CompanyDetailData } from './onboarding.dto'

export type UserType = 'COMPANY' | 'MEMBER'
export type ProfileType = 'COMPANY' | 'MEMBER'
export type UserActionStatus = 'ACTIVE' | 'INACTIVE'
export type UserRegisterType = 'SYNCRA_APP' | 'FACEBOOK' | 'GOOGLE' | 'APPLE'
export type AccountGroupType = 'GROUP_COMPANY' | 'GROUP_GOOGLE' | 'GROUP_FACEBOOK' | 'GROUP_COMPANY_STAFF'
export type UserAuthStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'FORCE_CHANGE_PASSWORD' | 'RESET_REQUIRED' | 'COMPROMISED' | 'ARCHIVED' | 'UNKNOWN'

interface ProfilePrivilege {
  role: RoleData
  permissions: string[]
}

export interface CompanyFeatures {
  erpExport: boolean
}

export interface ProfileData {
  id: number
  logo: string
  email: string
  role: string
  group: string
  type: UserType
  logoUrl: string
  jobTitle: string
  username: string
  lastName: string
  roleName: string
  fullName: string
  firstName: string
  profileId: number
  companyId: number
  profileType: ProfileType
  memberInfoId: number
  displayName: string
  companyName: string
  phoneNumber: string
  detailCompleted: boolean
  status: UserActionStatus
  representCompleted: boolean
  representative: RepresentiveData
  companyDetail: CompanyDetailData
  subscriptions: SubscriptionData[]
  profilePrivilege: ProfilePrivilege
  tokenBalance?: BalanceDto.Item
  companyFeatures?: CompanyFeatures
}

interface BaseParam {
  companyId: number
}

export type UpdateCompanyDetailParam = BaseParam
export type UpdateRepresentativeParam = BaseParam

export interface UpdateProfileReq {
  firstName: string
  lastName: string
  jobTitle: string
}

export interface ChangePasswordReq {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export type UploadAvatarReq = FormData

export interface UpdateCompanyDetailReq {
  companyName: string
  companyEmailAddress: string
  industryType: string
  companySize: string
  countryRegion: string
  contactCountryCode: string
  companyContact: string
  companyAddress: string
  howDidYouHear: string
  companyId: number
}

export interface UpdateRepresentativeReq {
  companyId: number
  firstName: string
  lastName: string
  rolePosition: string
  countryCode: string
  contactNumber: string
  workEmail: string
  preferredContactMethod: string
}

export type ProfileRes = BaseRes<ProfileData>
export type ChangePasswordRes = BaseRes<string>
export type UploadAvatarRes = BaseRes<ProfileData>
export type UpdateProfileRes = BaseRes<ProfileData>
export type UpdateCompanyDetailRes = BaseRes<CompanyDetailData>
export type UpdateRepresentativeRes = BaseRes<RepresentiveData>
