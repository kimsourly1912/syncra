<script lang="ts" setup>
import { tv } from 'tailwind-variants'

const $tv = tv({
  base: tw`w-full mx-auto`,
  variants: {
    size: {
      default: tw`space-y-10`,
      sm: tw`space-y-6 max-w-xl`,
      md: tw`space-y-8 max-w-3xl`,
      lg: tw`space-y-10 max-w-5xl`,
      xl: tw`space-y-12 max-w-8xl`,
    },
  },
  defaultVariants: {
    size: 'xl',
  },
})

defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'default'
}>()
</script>

<template>
  <main :class="$tv({ size })">
    <slot />
  </main>
</template>
