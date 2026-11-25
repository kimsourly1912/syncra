import * as v from 'valibot'
import { defineModel, vSaleRequestDashboardDto, vSaleRequestDetailDto, vSaleRequestListItemDto, vSaleRequestModuleItemDto, vSaleRequestSummaryDto } from '@/api'
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

// One requested module in the detail. The features are the names the customer picked.
export const saleRequestModuleItemModel = defineModel(vSaleRequestModuleItemDto, {
  required: [],
  optional: ['id', 'moduleCode', 'moduleName', 'requestedFeatures'],
})

// `GET /admin/sale-requests/{id}` has no response envelope. Which fields are filled for each
// request type isn't documented, so every field is optional and an empty list shows as none.
export const saleRequestDetailModel = v.object({
  summary: v.nullish(defineModel(vSaleRequestSummaryDto, {
    required: [],
    optional: ['requestCode', 'submittedAt', 'requestedByName', 'emailAddress', 'requestedType', 'source', 'requestStatus', 'customerMessage'],
  })),
  moduleItems: v.nullish(v.array(saleRequestModuleItemModel), () => []),
  ...defineModel(vSaleRequestDetailDto, { required: [], optional: ['tokenAmount', 'additionalSeats'] }).entries,
})

export type SaleRequestDetail = v.InferOutput<typeof saleRequestDetailModel>
export type SaleRequestModuleItem = v.InferOutput<typeof saleRequestModuleItemModel>
