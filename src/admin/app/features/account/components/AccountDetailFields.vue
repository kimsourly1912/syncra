<script setup lang="ts">
defineProps<{
  fields: { label: string, value: string }[]
}>()
</script>

<template>
  <dl class="divide-y divide-default">
    <div
      v-for="field in fields"
      :key="field.label"
      class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-baseline gap-3 py-3 text-sm"
    >
      <dt class="text-muted">
        {{ field.label }}
      </dt>
      <dd class="font-medium wrap-anywhere text-highlighted">
        {{ field.value }}
      </dd>
    </div>
  </dl>
</template>
