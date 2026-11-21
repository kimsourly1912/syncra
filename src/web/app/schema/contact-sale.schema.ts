import { baseSchema } from './base.schema'
import * as v from 'valibot'

export type IContactSaleSchema = v.InferOutput<typeof contactSaleSchema>

export const MAX_WORD = 400

export const contactSaleSchema = v.object({
  name: baseSchema.string,
  companyName: baseSchema.string,
  email: baseSchema.email,
  phone: baseSchema.phone,
  phoneCode: baseSchema.string,
  helpWith: v.pipe(
    v.string(),
    v.maxWords('en', MAX_WORD, `Words limit reached. Please shorten your message`),
  ),
  modules: baseSchema.array,
})
