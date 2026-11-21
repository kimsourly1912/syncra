import * as v from 'valibot'
import { baseSchema } from '@/schema/base.schema'

export type IContactSaleSchema = v.InferOutput<typeof contactSaleSchema>

export const MAX_WORD = 400

export const contactSaleSchema = v.object({
  interestedProduct: baseSchema.array,
  helpWith: v.pipe(
    v.string(),
    v.maxWords('en', MAX_WORD, `Words limit reached. Please shorten your message`),
  ),
})
