import * as v from 'valibot'
import { vSyncraAdminProfileRequest } from '@/api'

const { username } = vSyncraAdminProfileRequest.entries

export const profileSchema = v.object({
  username: v.pipe(v.nonNullish(username), v.trim(), v.nonEmpty('This field is required')),
})

export type IProfileSchema = v.InferOutput<typeof profileSchema>
