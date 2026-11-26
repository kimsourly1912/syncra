import * as v from 'valibot'
import { vAdminCompanyDetailRequest, vSyncraAdminCreateUserRequest } from '@/api'
import { PASSWORD_RULES } from '@/features/auth'

const { email, firstName, lastName } = vSyncraAdminCreateUserRequest.entries
const { companyName } = vAdminCompanyDetailRequest.entries

const required = 'This field is required'

// Creating a company and its first admin. UI only: `POST /admin/portal-users/company-admin` has
// no password field (the API generates one and returns it), so `tempPassword` isn't sent
// anywhere until the API owner settles who sets it (docs/product/open-questions.md).
export const createAdminSchema = v.object({
  companyName: v.pipe(v.nonNullish(companyName), v.trim(), v.nonEmpty(required)),
  firstName: v.pipe(v.nonNullish(firstName), v.trim(), v.nonEmpty(required)),
  lastName: v.pipe(v.nonNullish(lastName), v.trim(), v.nonEmpty(required)),
  email: v.pipe(v.nonNullish(email), v.trim(), v.nonEmpty(required), v.email('Invalid email')),
  tempPassword: v.pipe(
    v.string(),
    v.nonEmpty(required),
    v.check(password => PASSWORD_RULES.every(rule => v.is(rule.schema, password)), 'Password too weak'),
  ),
})

export type ICreateAdminSchema = v.InferOutput<typeof createAdminSchema>
