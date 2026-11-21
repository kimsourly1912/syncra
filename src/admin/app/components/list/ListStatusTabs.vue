<script lang="ts">
import type { TabsItem } from '@nuxt/ui'

export interface ListStatusTab<V extends string = string> {
  label: string
  value: V
  /** An Iconify name shown before the label. */
  icon?: string
  /** Rows with this status; the badge is left out until it's known. */
  count?: number | null
}
</script>

<script setup lang="ts" generic="T extends string">
/**
 * A list's status filter as tabs with an icon and a count ("New 4 · Contacted 3"); the counts
 * replace a separate row of stat cards. Bind it to the status in
 * `useListQuery`. Name the group with `aria-label`: UTabs puts attributes on its own root, so
 * the label lands on this group around it.
 *
 * @example
 * <ListStatusTabs :model-value="list.filters.value.status" :items="tabs" aria-label="Lead status" @update:model-value="status => list.setFilters({ status })" />
 */
const props = defineProps<{
  items: ListStatusTab<T>[]
  disabled?: boolean
}>()

const status = defineModel<T>({ required: true })

const tabs = computed<TabsItem[]>(() => props.items.map(item => ({
  label: item.label,
  icon: item.icon,
  value: item.value,
  disabled: props.disabled,
  badge: item.count == null ? undefined : { label: String(item.count), color: 'neutral', variant: 'subtle', size: 'sm' },
})))

// A row that doesn't fit scrolls, the chosen tab centered.
const root = useTemplateRef('root')
useCenteredTab(root, () => status.value)
</script>

<template>
  <div
    role="group"
    class="min-w-0"
  >
    <UTabs
      ref="root"
      v-model="status"
      :items="tabs"
      :content="false"
      variant="link"
    />
  </div>
</template>
