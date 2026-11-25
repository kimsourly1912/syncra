import { api } from '@/api'
import { emailTemplateListModel, emailTemplateModel } from '../models/email-template'

/**
 * The email templates, read-only. Editing (`PUT /admin/email-templates`) and mapping templates to
 * events aren't offered: who may change customer emails isn't confirmed (open question).
 */
export function useEmailTemplates() {
  return useApiQuery(
    'settings:email-templates',
    ({ signal }) => api.get('/admin/email-templates', { signal, model: emailTemplateListModel }),
  )
}

/** One template, loaded while `name` is set (the open panel). */
export function useEmailTemplate(name: MaybeRefOrGetter<string | undefined>) {
  return useApiQuery(
    () => `settings:email-template:${toValue(name) ?? ''}`,
    ({ signal }) => api.get('/admin/email-templates/{name}', { path: { name: toValue(name)! }, signal, model: emailTemplateModel }),
    { enabled: () => toValue(name) !== undefined },
  )
}
