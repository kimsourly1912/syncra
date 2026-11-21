<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { ModalProps } from '@nuxt/ui'

export type ModalContentSize = 'sm' | 'md' | 'lg' | 'xl'

const $tv = tv({
  base: tw`p-6 overflow-auto`,
  variants: {
    size: {
      sm: tw`max-w-xl`,
      md: tw`max-w-3xl`,
      lg: tw`max-w-5xl`,
      xl: tw`max-w-7xl`,
    },
  },
})

withDefaults(defineProps<{
  size?: ModalContentSize
  ui?: ModalProps['ui']
  dismissible?: ModalProps['dismissible']
}>(), {
  size: 'sm',
  dismissible: true,
})

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal
    v-model:open="model"
    :class="$tv({ size })"
    :ui
    :dismissible
  >
    <template #title />
    <template #description />
    <template #content="{ close }">
      <slot :close />
    </template>
  </UModal>
</template>
