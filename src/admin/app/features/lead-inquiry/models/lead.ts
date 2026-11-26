import * as v from 'valibot'
import { defineModel, vContactSaleInquiryResponse, vLeadDashboardCards, vSyncraModuleResponse } from '@/api'
import type { Api } from '@/api'

export type LeadStatus = NonNullable<Api.ContactSaleInquiryResponse['status']>

// A row of the lead list. Only the id is needed to open the lead; the rest may be missing.
const leadRowModel = defineModel(vContactSaleInquiryResponse, {
  required: ['id'],
  optional: ['inquiryCode', 'fullName', 'companyName', 'workEmail', 'phoneNumber', 'interestedProduct', 'status'],
})

// `GET /admin/lead-inquiries` has no response envelope. An empty page may omit `items`.
export const leadPageModel = v.object({
  items: v.nullish(v.array(leadRowModel), () => []),
  totalPages: v.pipe(v.number(), v.integer()),
})

// The status totals. A missing count shows no badge.
export const leadSummaryModel = defineModel(vLeadDashboardCards, {
  required: [],
  optional: ['leadReceived', 'contacted', 'converted', 'rejected'],
})

// `GET /admin/lead-inquiries/{id}` has no response envelope. What the contact form fills isn't
// documented, so every field but the id is optional. `reason` is the note sent with the last
// status change.
export const leadDetailModel = v.object({
  ...defineModel(vContactSaleInquiryResponse, {
    required: ['id'],
    optional: [
      'inquiryCode', 'fullName', 'companyName', 'workEmail', 'phoneNumber', 'country', 'companySize', 'industryType',
      'interestedProduct', 'documentTypes', 'mainGoals', 'agreedToContact', 'status', 'reason',
    ],
  }).entries,
  modules: v.nullish(v.array(defineModel(vSyncraModuleResponse, { required: [], optional: ['id', 'code', 'name'] })), () => []),
})

export type LeadRow = v.InferOutput<typeof leadRowModel>
