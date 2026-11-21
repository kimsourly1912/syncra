import * as v from 'valibot'
import { baseSchema } from '@/schema/base.schema'

export type ICompanySchema = v.InferOutput<typeof companySchema>
export type IRepresentativeSchema = v.InferOutput<typeof representativeSchema>

export const representativeSchema = v.object({
  firstName: baseSchema.string,
  lastName: baseSchema.string,
  rolePosition: baseSchema.string,
  code: baseSchema.string,
  phone: baseSchema.phone,
  email: baseSchema.email,
})

export const companySchema = v.object({
  name: baseSchema.string,
  email: baseSchema.email,
  industry: baseSchema.string,
  size: baseSchema.string,
  country: baseSchema.string,
  address: baseSchema.string,
  code: baseSchema.string,
  phone: baseSchema.phone,
})
