<script lang="ts" setup>
import { motion } from 'motion-v';
import { tv } from 'tailwind-variants';

const $tv = tv({
  base: tw`w-full mx-auto flex flex-col gap-14`,
  variants: {
    size: {
      sm: tw`xl:max-w-6xl`,
      md: tw`xl:max-w-7xl`,
      lg: tw`xl:max-w-8xl`
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()

</script>

<template>
  <motion.main :class="$tv({ size })" :initial="{ x: '-20px', opacity: 0 }" :animate="{ x: 0, opacity: 1 }" :transition="{
    bounce: 0.2, visualDuration: 0.2, type: 'spring',
  }">
    <slot />
  </motion.main>
</template>
