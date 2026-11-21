import type { BadgeProps } from '@nuxt/ui'

export type ItemType = 'badge' | 'text'

export interface ListItem {
  label: string
  value: string
  type: ItemType
  color?: BadgeProps['color']
}
