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

// Literal class names, so Tailwind generates them.
const ICON_COLOR: Record<NonNullable<CardStat['color']>, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-muted',
}

// Compact tiles: up to three stay in one row even on a phone; longer rows wrap there.
const columns = computed(() => {
  const c = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5',
  }
  return c[props.items.length as keyof typeof c] ?? 'grid-cols-2 lg:grid-cols-3'
})
</script>

<template>
  <ul :class="['grid gap-2 sm:gap-4', columns]">
    <li
      v-for="item in items"
      :key="item.label"
      class="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 rounded-lg border border-default bg-elevated/40 p-2.5 sm:gap-x-3 sm:p-4"
    >
      <!-- Phone: the icon sits beside the value and the label takes the tile's full width below.
           From `sm` the icon spans both lines. -->
      <UIcon
        :name="item.icon"
        :class="['size-5 shrink-0 sm:row-span-2 sm:size-7', ICON_COLOR[item.color ?? 'neutral']]"
        aria-hidden="true"
      />
      <p class="min-w-0 text-xl leading-tight font-semibold text-highlighted tabular-nums sm:text-2xl">
        <slot
          name="value"
          :item
        >
          {{ item.value }}
        </slot>
      </p>
      <p class="col-span-2 truncate text-xs text-muted sm:col-span-1 sm:text-sm">
        {{ item.label }}
      </p>
    </li>
  </ul>
</template>
