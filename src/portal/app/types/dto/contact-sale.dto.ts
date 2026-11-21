import type { BaseRes } from './base.dto'

export interface ContactSaleData {
  id: number
  fullName: string
  companyName: string
  workEmail: string
  phoneNumber: string
  country: string
  companySize: string
  industryType: string
  interestedProduct: string
  documentTypes: string
  mainGoals: string
  agreedToContact: boolean
}

export interface ContactSaleReq {
  companyId: number
  description: string
  agreedToContact: boolean
  interestedProduct: string[]
}

export interface RequestTokenData {
  requestCode: string
}

export interface RequestTokenReq {
  tokenAmount: number
  emailAddress: string
  requestedByName: string
  customerMessage: string
}

export type RequestTokenRes = RequestTokenData
export type ContactSaleRes = BaseRes<ContactSaleData>
