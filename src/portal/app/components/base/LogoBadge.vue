<script setup lang="ts">
import { tv } from 'tailwind-variants'

const $tv = tv({
  base: tw`bg-white dark:bg-elevated/70 ring-4 p-px ring-primary/10 rounded-full`,
  variants: {
    size: {
      xs: tw`size-5`,
      sm: tw`size-6`,
      md: tw`size-8`,
      lg: tw`size-10`,
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

defineProps<{
  src: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <NuxtImg
    :src
    :class="$tv({ size })"
  />
</template>
