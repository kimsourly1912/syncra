import * as v from 'valibot'
import { baseSchema } from '@/schema/base.schema'

export type IContactSaleForTokenSchema = v.InferOutput<typeof contactSaleForTokenSchema>

export const MAX_WORD = 400

export const contactSaleForTokenSchema = v.object({
  amount: baseSchema.string,
  message: v.pipe(
    v.string(),
    v.maxWords('en', MAX_WORD, `Words limit reached. Please shorten your message`),
  ),
})
