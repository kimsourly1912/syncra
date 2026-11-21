import * as v from 'valibot'
import { defineModel, vSaleRequestDashboardDto, vSaleRequestListItemDto } from '@/api'
import type { Api } from '@/api'

export type SaleRequestStatus = NonNullable<Api.SaleRequestListItemDto['status']>
export type SaleRequestType = NonNullable<Api.SaleRequestListItemDto['requestType']>
export type SaleRequestSource = NonNullable<Api.SaleRequestListItemDto['source']>

// A row of the sale request list.
export const saleRequestRowModel = defineModel(vSaleRequestListItemDto, {
  required: ['id'],
  optional: ['requestCode', 'userName', 'emailAddress', 'requestType', 'source', 'submitDate', 'status'],
})

// `GET /admin/sale-requests` has no response envelope. An empty page may omit `items`.
export const saleRequestPageModel = v.object({
  items: v.nullish(v.array(saleRequestRowModel), () => []),
  totalPages: v.pipe(v.number(), v.integer()),
})

// The totals cards. A missing count shows as a dash.
export const saleRequestSummaryModel = defineModel(vSaleRequestDashboardDto, {
  required: [],
  optional: ['total', 'pending', 'approved', 'rejected'],
})

export type SaleRequestRow = v.InferOutput<typeof saleRequestRowModel>
export type SaleRequestSummary = v.InferOutput<typeof saleRequestSummaryModel>
