<script setup lang="ts">
defineProps<{
  to: string
  label?: string
}>()
</script>

<template>
  <UButton
    :label
    :to
    icon="lucide:arrow-left"
    variant="ghost"
    color="neutral"
  />
</template>
