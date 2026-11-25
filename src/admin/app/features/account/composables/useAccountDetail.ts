import { api } from '@/api'
import { accountDetailModel } from '../models/account-detail'

/**
 * One portal account's overview and company information. Modules, tokens, and seats have no read
 * endpoint yet (open question), so those tabs show sample data.
 */
export function useAccountDetail(userId: MaybeRefOrGetter<number | undefined>) {
  return useApiQuery(
    () => `account:detail:${toValue(userId) ?? ''}`,
    ({ signal }) => api.get('/admin/portal-users/{userId}/account-detail', {
      path: { userId: toValue(userId)! },
      signal,
      model: accountDetailModel,
    }),
    { enabled: () => toValue(userId) !== undefined },
  )
}
