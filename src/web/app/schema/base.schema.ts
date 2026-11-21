import * as v from 'valibot'
import { REGX_INT } from '@/constants/regx'

const msg = 'This field is required'

export const baseSchema = {
  string: v.pipe(v.string(), v.minLength(1, msg)),
  email: v.pipe(v.string(), v.minLength(1, msg), v.email('Invalid email')),
  phone: v.pipe(v.string(), v.minLength(1, msg), v.regex(REGX_INT, 'Invalid phone number')),
  array: v.pipe(
    v.array(v.string()),
    v.minLength(1, msg),
  ),
}
