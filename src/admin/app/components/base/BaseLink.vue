<script setup lang="ts">
import type { LinkProps } from '@nuxt/ui'

const props = defineProps<LinkProps>()
</script>

<template>
  <ULink
    v-bind="props"
    class="text-info font-normal underline"
  >
    <slot />
  </ULink>
</template>
