<script lang="ts">
import type { BadgeProps } from '@nuxt/ui'

export interface CardStat {
  label: string
  value: string
  icon: string
  color: BadgeProps['color']
}
</script>

<script setup lang="ts">
const props = defineProps<{
  items: CardStat[]
}>()

defineSlots<{
  value?(props: { item: CardStat }): unknown
}>()

// UPageGrid stops at three columns; wider rows of stats get their own breakpoint.
const columns = computed(() => {
  const c = {
    4: 'lg:grid-cols-4',
    5: 'xl:grid-cols-5',
  }
  return c[props.items.length as keyof typeof c]
})
</script>

<template>
  <UPageGrid :class="['gap-4', columns]">
    <UPageCard
      v-for="item in items"
      :key="item.label"
      :title="item.label"
      variant="outline"
      :ui="{ title: 'font-normal text-muted' }"
    >
      <template #leading>
        <UBadge
          :icon="item.icon"
          :color="item.color"
          variant="soft"
          size="xl"
          square
        />
      </template>

      <p class="flex items-center gap-2 text-2xl text-highlighted">
        <slot
          name="value"
          :item
        >
          {{ item.value }}
        </slot>
      </p>
    </UPageCard>
  </UPageGrid>
</template>
