<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <CardTitle :title />
    </template>
    <slot />
  </UCard>
</template>
