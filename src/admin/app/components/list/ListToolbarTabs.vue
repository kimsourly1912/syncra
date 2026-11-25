<script lang="ts">
import type { TabsItem } from '@nuxt/ui'

/** A tab. `count` (a status total) shows as a badge; missing shows none. */
export type ToolbarTab<T extends string> = TabsItem & { value: T, count?: number | null }
</script>

<script setup lang="ts" generic="T extends string">
/**
 * Tabs in a `UDashboardToolbar`: the toolbar's full-width line is the tabs' line, so the tabs drop
 * their own and sit on it, the active tab's underline on the toolbar's border. A row that doesn't
 * fit scrolls, the chosen tab centered. Tabs anywhere else keep Nuxt UI's `link` line.
 *
 * @example
 * <UDashboardToolbar><ListToolbarTabs v-model="tab" :items="tabs" /></UDashboardToolbar>
 */
const props = defineProps<{ items: ToolbarTab<T>[] }>()
const tab = defineModel<T>({ required: true })

const root = useTemplateRef('root')
useCenteredTab(root, () => tab.value)

const shown = computed(() => props.items.map(({ count, ...item }): TabsItem & { value: T } => (count == null
  ? item
  : { ...item, badge: { label: formatCount(count), color: 'neutral', variant: 'subtle', size: 'sm' } })))
</script>

<template>
  <UTabs
    ref="root"
    v-model="tab"
    :items="shown"
    :content="false"
    variant="link"
    :ui="{ root: 'min-w-0 max-w-full self-end max-sm:-mb-2', list: 'mb-0 border-b-0 px-0', indicator: 'bottom-0' }"
  />
</template>
