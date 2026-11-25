import * as v from 'valibot'
import { defineModel, vCreditPackageDto } from '@/api'

// A credit (token) package customers can buy. Only the id is needed to list it.
export const tokenPackageModel = defineModel(vCreditPackageDto, {
  required: ['id'],
  optional: ['code', 'name', 'description', 'tokenAmount', 'price', 'currency', 'expiryDays', 'sortOrder'],
})

// `GET /admin/credits/packages`: an empty list may come back as no `data`.
export const tokenPackageListModel = v.nullish(v.array(tokenPackageModel), () => [])

export type TokenPackage = v.InferOutput<typeof tokenPackageModel>
