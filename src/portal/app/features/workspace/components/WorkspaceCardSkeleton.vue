<script setup lang="ts">
withDefaults(defineProps<{
  length?: number
}>(), {
  length: 4,
})
</script>

<template>
  <li
    v-for="i in length"
    :key="i"
    class="p-4 bg-elevated/50 flex flex-col gap-4 border border-default transition-all rounded-lg"
  >
    <header class="flex items-center gap-4">
      <USkeleton class="size-14 rounded-full" />
      <USkeleton class="h-4 max-w-28 w-full" />
    </header>
    <USkeleton class="h-3" />
    <USkeleton class="h-3" />
    <footer class="flex items-center gap-2">
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
    </footer>
  </li>
</template>
