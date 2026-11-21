import * as v from 'valibot'
import { REGX_INT, REGX_AWS_PASSWORD } from '@/constants/regx'
import { CODE_LENGTH } from '@/data/auth.data'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '~/constants/app'

const msg = 'This field is required'

const fileSchema = v.pipe(
  v.file(msg),
  v.mimeType(ACCEPTED_IMAGE_TYPES, `Please select a ${ACCEPTED_IMAGE_TYPES.join(', ')} file.`),
  v.maxSize(MAX_IMAGE_SIZE, 'Please select a file smaller than 2 MB.'),
)

export const baseSchema = {
  file: fileSchema,
  boolean: v.boolean(msg),
  true: v.literal(true, msg),
  string: v.pipe(v.string(), v.minLength(1, msg)),
  email: v.pipe(v.string(), v.minLength(1, msg), v.email('Invalid email')),
  phone: v.pipe(v.string(), v.minLength(1, msg), v.regex(REGX_INT, 'Invalid phone number')),
  array: v.pipe(
    v.array(v.string()),
    v.minLength(1, msg),
  ),
  awsPassword: v.pipe(
    v.string(),
    v.minLength(1, msg),
    v.regex(REGX_AWS_PASSWORD, 'Password too weak'),
  ),
  otp: v.pipe(v.string(), v.minLength(CODE_LENGTH, `Required ${CODE_LENGTH} code`)),
  password: v.pipe(
    v.string(),
    v.minLength(1, msg),
    v.minLength(8, 'Must be at least 8 characters'),
  ),
  optional: {
    file: v.optional(fileSchema),
    string: v.optional(v.string()),
    email: v.optional(v.pipe(v.string(), v.email('Invalid email'))),
    phone: v.optional(v.pipe(v.string(), v.regex(REGX_INT, 'Invalid phone number'))),
    boolean: v.optional(v.boolean()),
  },
}
