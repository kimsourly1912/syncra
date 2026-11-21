import type * as v from 'valibot'
import { defineModel, vSyncraAdminProfileResponse } from '@/api'

// The signed-in staff member. A profile without an id isn't a usable session.
export const staffProfileModel = defineModel(vSyncraAdminProfileResponse, {
  required: ['id'],
  optional: ['username', 'email', 'logoUrl', 'group', 'role', 'userStatus'],
})

export type StaffProfile = v.InferOutput<typeof staffProfileModel>
