<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { tv } from 'tailwind-variants'
import type { PrimitiveProps } from 'reka-ui'

export type BaseTypographyType = 'heading-1' | 'heading-2' | 'heading-3' | 'text'

const $tv = tv({
  base: tw`inline-flex`,
  variants: {
    type: {
      'text': tw`text-muted text-sm`,
      'heading-1': tw`text-highlighted text-xl font-semibold`,
      'heading-2': tw`text-highlighted text-lg font-semibold`,
      'heading-3': tw`text-highlighted text-base font-semibold`,
    } satisfies Record<BaseTypographyType, string>,
    shouldWrap: {
      true: tw`break-keep wrap-anywhere`,
    },
  },
})

withDefaults(defineProps<{
  text?: string
  as?: PrimitiveProps['as']
  type?: BaseTypographyType
  shouldWrap?: boolean
}>(), {
  text: '',
  as: 'span',
  type: 'heading-3',
})
</script>

<template>
  <Primitive
    :as
    :class="$tv({ type, shouldWrap })"
  >
    <slot>
      {{ text }}
    </slot>
  </Primitive>
</template>
