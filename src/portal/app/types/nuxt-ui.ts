import type { OmitNullish, AcceptLiteral } from './common'
import type { BadgeProps } from '@nuxt/ui'

export type NuxtUIColor = OmitNullish<BadgeProps['color']>
export type NuxtUIVariant = OmitNullish<BadgeProps['variant']>

export interface ColumnSort {
  id: string
  desc: boolean
}

type Eliminate<T> = T extends symbol ? never : T extends number ? never : T

export type ColumnSortWithKey<T extends object> = {
  [K in keyof ColumnSort]: K extends 'id' ? AcceptLiteral<Eliminate<keyof T>> : ColumnSort[K]
}
