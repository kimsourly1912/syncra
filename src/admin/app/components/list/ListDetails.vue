<script lang="ts">
export interface ListDetail {
  label: string
  value: string
  type?: 'text' | 'badge'
}
</script>

<script setup lang="ts">
defineProps<{
  items: ListDetail[]
}>()
</script>

<template>
  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div
      v-for="item in items"
      :key="item.label"
    >
      <dt class="text-muted text-sm">
        {{ item.label }}
      </dt>
      <dd class="mt-1">
        <UBadge
          v-if="item.type === 'badge'"
          variant="soft"
          :label="item.value"
          size="lg"
        />
        <span
          v-else
          class="text-highlighted"
        >{{ item.value }}</span>
      </dd>
    </div>
  </dl>
</template>
