import * as v from 'valibot'
import { defineModel, vAdminUserSummaryResponse, vUserResponseRow } from '@/api'
import type { Api } from '@/api'

export type OnboardingStatus = NonNullable<Api.UserResponseRow['onboardingStatus']>

// A row of the account list. Only the user id is needed to open the account.
const portalUserRowModel = defineModel(vUserResponseRow, {
  required: ['userId'],
  optional: ['companyId', 'email', 'firstname', 'lastname', 'onboardingStatus', 'moduleActiveCount', 'token', 'seatUsed', 'seatTotal'],
})

// An empty page may omit `items`.
export const portalUserPageModel = v.object({
  items: v.nullish(v.array(portalUserRowModel), () => []),
  totalPages: v.pipe(v.number(), v.integer()),
})

// The totals cards. A missing count shows as a dash.
export const portalUserSummaryModel = defineModel(vAdminUserSummaryResponse, {
  required: [],
  optional: ['accountRegistered', 'completedOnboardingVerification', 'pendingOnboardingVerification'],
})

export type PortalUserRow = v.InferOutput<typeof portalUserRowModel>
