import * as v from 'valibot'
import { baseSchema } from './base.schema'

export type ICompanySchema = v.InferOutput<typeof companySchema>
export type IProfileDetailSchema = v.InferOutput<typeof profileDetailSchema>
export type IChangePasswordSchema = v.InferOutput<typeof changePasswordSchema>
export type IRepresentativeSchema = v.InferOutput<typeof representativeSchema>

export const profileDetailSchema = v.object({
  avatar: baseSchema.optional.file,
  firstName: baseSchema.optional.string,
  lastName: baseSchema.optional.string,
  jobTitle: baseSchema.optional.string,
})

export const changePasswordSchema = v.pipe(
  v.object({
    currentPassword: baseSchema.string,
    newPassword: baseSchema.awsPassword,
    confirmPassword: baseSchema.string,
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      input => input.newPassword === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
)

export const representativeSchema = v.object({
  firstName: baseSchema.optional.string,
  lastName: baseSchema.optional.string,
  rolePosition: baseSchema.optional.string,
  code: baseSchema.optional.string,
  phone: baseSchema.optional.phone,
  email: baseSchema.optional.email,
})

export const companySchema = v.object({
  name: baseSchema.optional.string,
  email: baseSchema.optional.email,
  industry: baseSchema.optional.string,
  size: baseSchema.optional.string,
  country: baseSchema.optional.string,
  address: baseSchema.optional.string,
  code: baseSchema.optional.string,
  phone: baseSchema.optional.phone,
})
