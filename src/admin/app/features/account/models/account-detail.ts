import * as v from 'valibot'
import { defineModel, vCompanyDetail, vOverview, vRepresentative } from '@/api'

// `GET /admin/portal-users/{userId}/account-detail`. Which fields a portal user always has isn't
// documented, so each part may be missing and every field is optional; the screen shows a dash.
export const accountDetailModel = v.object({
  overview: v.nullish(defineModel(vOverview, {
    required: [],
    optional: ['userId', 'username', 'email', 'registeredDate', 'onboardingStatus', 'role', 'companyId'],
  })),
  companyInformation: v.nullish(v.object({
    companyDetail: v.nullish(defineModel(vCompanyDetail, {
      required: [],
      optional: ['companyName', 'companyEmail', 'industryType', 'companySize', 'country', 'phoneNumber'],
    })),
    representative: v.nullish(defineModel(vRepresentative, {
      required: [],
      optional: ['fullName', 'position', 'workEmail', 'contactNumber'],
    })),
  })),
})

export type AccountDetail = v.InferOutput<typeof accountDetailModel>
