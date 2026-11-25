import * as v from 'valibot'
import { defineModel, vEmailTemplate } from '@/api'

// An email template. The name is how mappings and the API refer to it; the bodies may be missing.
export const emailTemplateModel = defineModel(vEmailTemplate, {
  required: ['name'],
  optional: ['subject', 'html', 'text'],
})

// `GET /admin/email-templates`: an empty list may come back as no `data`.
export const emailTemplateListModel = v.nullish(v.array(emailTemplateModel), () => [])

export type EmailTemplate = v.InferOutput<typeof emailTemplateModel>
