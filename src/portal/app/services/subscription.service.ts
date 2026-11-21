import type { SubscriptionDTO } from '@/types/dto'

export const ENDPOINT = {
  prefix: '/workspaces/company',
  parts: {
    plan: 'plan',
    status: 'status',
    subscriptions: 'subscriptions',
  },
} as const

// type Part = keyof typeof ENDPOINT.parts | ({} & string | number)

export function findSubscriptions(param: SubscriptionDTO.SubscriptionParam) {
  const { companyId } = param
  const endpoint = buildEndPoint(ENDPOINT.prefix, [companyId, 'subscriptions'])
  return useAPI<SubscriptionDTO.SubscriptionRes>(endpoint, { method: 'GET' })
}
