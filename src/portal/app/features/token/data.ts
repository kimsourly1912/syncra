import type { TabsItem } from '@nuxt/ui'
import type { Type, TypeItem } from './type'
import type { TransactionDto } from '@/types/dto/token'

export const typeItems: TabsItem[] = [
  {
    label: 'All',
    value: 'ALL',
  },
  {
    label: 'Consumed',
    value: 'USAGE',
  },
  {
    label: 'Received',
    value: 'RECEIVED',
  },
]

export function activityFilter(tab: string): Partial<Pick<TransactionDto.Query, 'direction' | 'type'>> {
  if (tab === 'RECEIVED') return { direction: 'RECEIVED' }
  if (tab === 'USAGE') return { type: 'USAGE' }
  return {}
}

export const typeMap = {
  USAGE: {
    label: 'Usage',
    color: 'neutral',
  },
  GRANT: {
    label: 'Top-up',
    color: 'success',
  },
  ADJUSTMENT: {
    label: 'Adjust',
    color: 'warning',
  },
  EXPIRY: {
    label: 'Expiry',
    color: 'error',
  },
  REFUND: {
    label: 'Refund',
    color: 'neutral',
  },
  TRANSFER: {
    label: 'Transfer',
    color: 'info',
  },
} satisfies Record<Type, TypeItem>

export function getType(v: Type) {
  return typeMap[v]
}
