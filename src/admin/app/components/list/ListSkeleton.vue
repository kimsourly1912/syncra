<script setup lang="ts">
/**
 * Placeholder rows while a list has nothing to show for its query yet (`useApiQuery().loading`):
 * the first load, and a filter, search, or page change. Shaped like rows, so nothing jumps when
 * the data arrives. Put it in `UTable`'s `#loading` slot, or in place of a list. The label is for
 * screen readers.
 *
 * @example
 * <UTable :data="items" :columns="columns" :loading="loading">
 *   <template #loading><ListSkeleton label="Loading leads…" /></template>
 * </UTable>
 */
withDefaults(defineProps<{
  label: string
  rows?: number
}>(), { rows: 5 })
</script>

<template>
  <div
    role="status"
    :aria-label="label"
    class="divide-y divide-default text-start"
  >
    <span class="sr-only">{{ label }}</span>
    <div
      v-for="row in rows"
      :key="row"
      class="flex items-center gap-4 py-3"
    >
      <USkeleton class="h-4 w-1/6" />
      <USkeleton class="h-4 w-1/4" />
      <USkeleton class="h-4 flex-1" />
      <USkeleton class="h-5 w-16 rounded-full" />
    </div>
  </div>
</template>
