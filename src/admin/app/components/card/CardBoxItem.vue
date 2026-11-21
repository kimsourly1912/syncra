<script setup lang="ts">
import type { CardBoxItem } from '@/types/components/card'

defineProps<{
  items: CardBoxItem[]
}>()

const theme = {
  title: 'text-highlighted text-2xl mt-auto',
}
</script>

<template>
  <li
    v-for="(o, idx) in items"
    :key="idx"
    class="bg-default flex flex-col gap-6 border border-default rounded-lg p-4"
  >
    <header class="flex items-start justify-between gap-2">
      <span class="text-muted">{{ o.label }}</span>
      <slot
        name="icon"
        :item="o"
      >
        <UBadge
          :icon="o.icon"
          variant="soft"
          size="lg"
          class="p-2"
          :color="o.color"
        />
      </slot>
    </header>

    <slot
      name="bottom"
      :theme
      :item="o"
    >
      <h1 :class="theme.title">
        {{ o.value }}
      </h1>
    </slot>
  </li>
</template>
