import * as v from 'valibot'
import { vSuperAdminLoginRequest } from '@/api'

// Fields come from the login request in the API contract, where every field is nullish;
// the form requires them.
const { email, password } = vSuperAdminLoginRequest.entries

export const signInSchema = v.object({
  email: v.pipe(v.nonNullish(email), v.nonEmpty('This field is required'), v.email('Invalid email')),
  password: v.pipe(v.nonNullish(password), v.nonEmpty('This field is required')),
})

export type ISignInSchema = v.InferOutput<typeof signInSchema>
