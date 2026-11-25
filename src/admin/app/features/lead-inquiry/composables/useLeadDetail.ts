import { api } from '@/api'
import { leadDetailModel } from '../models/lead'

/**
 * One lead, read-only. Loads while `id` is set, so a closed panel sends nothing. Changing a
 * lead's status isn't wired: the detail's endpoints and permissions aren't confirmed (open question).
 */
export function useLeadDetail(id: MaybeRefOrGetter<number | undefined>) {
  return useApiQuery(
    () => `lead-inquiries:detail:${toValue(id) ?? ''}`,
    ({ signal }) => api.get('/admin/lead-inquiries/{id}', {
      path: { id: toValue(id)! },
      envelope: false,
      signal,
      model: leadDetailModel,
    }),
    { enabled: () => toValue(id) !== undefined },
  )
}
