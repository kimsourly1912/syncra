import { api } from '@/api'
import { saleRequestDetailModel } from '../models/sale-request'

/**
 * One sale request, read-only. Loads while `id` is set, so a closed panel sends nothing.
 * Approving, rejecting, and completing aren't wired: what they do and who may isn't specified
 * (open question).
 */
export function useSaleRequestDetail(id: MaybeRefOrGetter<number | undefined>) {
  return useApiQuery(
    () => `sale-request:detail:${toValue(id) ?? ''}`,
    ({ signal }) => api.get('/admin/sale-requests/{id}', {
      path: { id: toValue(id)! },
      signal,
      model: saleRequestDetailModel,
    }),
    { enabled: () => toValue(id) !== undefined },
  )
}
