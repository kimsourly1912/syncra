import type { BadgeProps } from '@nuxt/ui'
import type { TransactionDto } from '@/types/dto/token'

export type Type = TransactionDto.Type

export interface TypeItem {
  label: string
  color: BadgeProps['color']
}

export interface TokenItem {
  type: Type
  value: string
  email: string
  amount: number
  fullName: string
  createdAt: string
  description: string
  moduleName: string
  activityName: string
  imageUrl: string
  activityDetail: string
}
