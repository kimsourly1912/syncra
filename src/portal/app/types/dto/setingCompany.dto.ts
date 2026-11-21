import type { BaseRes } from './base.dto'

export interface CompanyDetailResponse {
  id: number
  companyId: number
  companyName: string
  companyEmailAddress: string
  industryType: string
  companySize: string
  countryRegion: string
  contactCountryCode: string
  companyContact: string
  companyAddress: string
  howDidYouHear: string
}

export interface CompanyRepresentativeResponse {
  id: number
  companyId: number
  firstName: string
  lastName: string
  rolePosition: string
  countryCode: string
  contactNumber: string
  workEmail: string
  preferredContactMethod: string
}

export interface CompanyData {
  companyId: number
  companyEmail: string
  companyPhoneNumber: string | null
  logo: string | null
  coverImageUrl: string | null
  companyDetailResponse: CompanyDetailResponse | null
  companyRepresentativeResponse: CompanyRepresentativeResponse | null
}
export interface Profile {
  firstName: string
  lastName: string
  roleName: string
  email: string
  logoUrl: string

}
export interface UpdateProfileNameDto {
  firstName: string
  lastName: string
}
export interface dataProfile {
  data: Profile
}
export interface changePasswordDto {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
export interface imageForm {
  logoUrl: string
}

export type setingCompany = BaseRes<CompanyData>
