<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <header class="text-center flex gap-2 flex-col items-center justify-center">
    <NuxtImg
      class="w-14 lg:hidden"
      src="/img/syncra-logo.png"
    />
    <h1 class="text-3xl font-semibold text-highlighted">
      {{ title }}
    </h1>
    <p class="text-muted">
      {{ description }}
    </p>
  </header>
</template>
