<script setup lang="ts">
import { computed } from 'vue'

type ContainerSize = '5xl' | '6xl' | '7xl' | 'full' | ({} & string)

const props = defineProps({
  size: {
    type: String as () => ContainerSize,
    default: '7xl',
  },
  paddingTop: {
    type: String,
    default: 'pt-10 lg:pt-20 pt-10 p-5',
  },
  paddingBottom: {
    type: String,
    default: 'pb-20',
  },
  glow: {
    type: Boolean,
    default: true,
  },
})

const sizesMap: Record<ContainerSize, string> = {
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': '',
}

const containerClasses = computed(() => [
  'mx-auto w-full',
  props.paddingTop,
  props.paddingBottom,
  sizesMap[props.size] ? sizesMap[props.size] : props.size,
])
</script>

<template>
  <UMain class="relative">
    <section :class="containerClasses">
      <slot />
      <!-- Glow background -->
      <template v-if="glow">
        <div
          class="size-2/4 bg-conic fixed rounded-full -z-10 opacity-20 blur-[200px] bg-teal-500 dark:bg-teal-400 top-0 left-0"
        />
        <div
          class="size-2/4 fixed rounded-full -z-10 opacity-20 blur-[200px] bg-primary bottom-0 right-0"
        />
      </template>
    </section>
  </UMain>
</template>
