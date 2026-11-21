<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <h1 class="text-highlighted text-lg font-medium">
    {{ title }}
  </h1>
</template>
