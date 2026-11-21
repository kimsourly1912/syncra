<script setup lang="ts">
import type { ListItem } from '@/types/components/list'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <li
    v-for="(o, idx) in items"
    :key="idx"
  >
    <span class="text-muted text-sm">{{ o.label }}</span> <br>
    <slot :item="o">
      <template v-if="o.type === 'badge'">
        <UBadge
          variant="soft"
          :label="o.value"
          size="lg"
        />
      </template>
      <template v-if="o.type === 'text'">
        <span class="text-highlighted">{{ o.value }}</span>
      </template>
    </slot>
  </li>
</template>
