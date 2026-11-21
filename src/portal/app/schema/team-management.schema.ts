import * as v from 'valibot'
import { baseSchema } from './base.schema'

export type IEditEmailSchema = v.InferOutput<typeof editEmailSchema>
export type IChangeRoleSchema = v.InferOutput<typeof changeRoleSchema>
export type ISeatRequestSchema = v.InferOutput<typeof seatRequestSchema>
// export type IChangeStatusSchema = v.InferOutput<typeof changeStatusSchema>
export type IInviteMemberSchema = v.InferOutput<typeof inviteMemberSchema>

export const inviteMemberSchema = v.object({
  email: baseSchema.email,
  role: baseSchema.string,
  jobTitle: baseSchema.string,
})

export const changeRoleSchema = v.object({
  role: baseSchema.string,
})

export const editEmailSchema = v.object({
  email: baseSchema.email,
})

export const seatRequestSchema = v.object({
  seat: baseSchema.string,
  agreed: baseSchema.optional.boolean,
  message: baseSchema.optional.string,
})

// export const changeStatusSchema = v.object({
//   status: baseSchema.string,
// })
