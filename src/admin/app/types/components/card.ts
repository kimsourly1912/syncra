import type { BadgeProps } from '@nuxt/ui'

export interface CardBoxItem {
  label: string
  value: string
  icon: string
  color: BadgeProps['color']
}
