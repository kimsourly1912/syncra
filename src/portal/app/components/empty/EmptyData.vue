<script setup lang="ts">
import type { EmptyProps } from '@nuxt/ui'

withDefaults(defineProps<EmptyProps>(), {
  icon: 'lucide:info',
  title: 'No data found',
  description: 'It looks like there is no data available.',
})
</script>

<template>
  <UEmpty
    :icon
    :title
    :description
    :variant
    :ui
    :actions
    :size
    :avatar
  />
</template>
