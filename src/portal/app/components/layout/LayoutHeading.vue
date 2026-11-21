<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-1">
    <BaseTypography
      v-if="title"
      as="h1"
      :text="title"
      type="heading-1"
    />
    <BaseTypography
      v-if="description"
      as="p"
      type="text"
      :text="description"
    />
  </header>
</template>
