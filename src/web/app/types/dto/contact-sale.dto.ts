import type { BaseRes } from './base.dto'

export interface ContactSaleReq {
  fullName: string
  companyName: string
  workEmail: string
  phoneNumber: string
  country: string
  companySize: string
  industryType: string
  interestedProduct: string[]
  documentTypes: string
  mainGoals: string
  agreedToContact: boolean
}

// since we don't need response data so simply declare just an ID
export interface ContactSaleData {
  id: number
}

export type ContactSaleRes = BaseRes<ContactSaleData>
