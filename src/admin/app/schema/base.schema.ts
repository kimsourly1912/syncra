import * as v from 'valibot'
import { REGX_INT, REGX_AWS_PASSWORD } from '~/constants/regx'

export const msg = {
  required: 'This field is required',
  notMatch: 'Passwords do not match.',
  weak: 'Password too weak',
  min8: 'Must be at least 8 characters',
  email: 'Invalid email',
  phone: 'Invalid phone number',
}

export const baseSchema = {
  string: v.pipe(v.string(), v.minLength(1, msg.required)),
  email: v.pipe(v.string(), v.minLength(1, msg.required), v.email(msg.email)),
  phone: v.pipe(v.string(), v.minLength(1, msg.required), v.regex(REGX_INT, msg.phone)),
  array: v.pipe(
    v.array(v.string()),
    v.minLength(1, msg.required),
  ),
  awsPassword: v.pipe(
    v.string(),
    v.minLength(1, msg.required),
    v.regex(REGX_AWS_PASSWORD, msg.weak),
  ),
  password: v.pipe(
    v.string(),
    v.minLength(1, msg.required),
    v.minLength(8, msg.min8),
  ),
}
