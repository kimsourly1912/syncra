import type { BaseRes } from './base.dto'

export interface RepresentiveData {
  id: number
  companyId: number
  firstName: string
  lastName: string
  rolePosition: string
  countryCode: string
  contactNumber: string
  workEmail: string
}

export interface CompanyDetailData {
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
  // howDidYouHear: string
}

export interface RepresentiveReq {
  companyId: number
  firstName: string
  lastName: string
  rolePosition: string
  countryCode: string
  contactNumber: string
  workEmail: string

}

export interface CompanyDetailReq {
  companyName: string
  companyEmailAddress: string
  industryType: string
  companySize: string
  countryRegion: string
  contactCountryCode: string
  companyContact: string
  companyAddress: string
  // howDidYouHear: string
  companyId: number
}

export type RepresentiveRes = BaseRes<RepresentiveData>
export type CompanyDetailRes = BaseRes<CompanyDetailData>
