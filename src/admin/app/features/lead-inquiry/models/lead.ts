import * as v from 'valibot'
import { defineModel, vContactSaleInquiryResponse, vLeadDashboardCards } from '@/api'
import type { Api } from '@/api'

export type LeadStatus = NonNullable<Api.ContactSaleInquiryResponse['status']>

// A row of the lead list. Only the id is needed to open the lead; the rest may be missing.
export const leadRowModel = defineModel(vContactSaleInquiryResponse, {
  required: ['id'],
  optional: ['inquiryCode', 'fullName', 'companyName', 'workEmail', 'phoneNumber', 'status'],
})

// `GET /admin/lead-inquiries` has no response envelope. An empty page may omit `items`.
export const leadPageModel = v.object({
  items: v.nullish(v.array(leadRowModel), () => []),
  totalPages: v.pipe(v.number(), v.integer()),
})

// The totals cards. A missing count shows as a dash.
export const leadSummaryModel = defineModel(vLeadDashboardCards, {
  required: [],
  optional: ['leadReceived', 'contacted', 'converted', 'rejected'],
})

export type LeadRow = v.InferOutput<typeof leadRowModel>
export type LeadSummary = v.InferOutput<typeof leadSummaryModel>
