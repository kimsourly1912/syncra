<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

/**
 * An empty list, built on `UEmpty`. Tells "nothing here yet" (offer to create) apart from "the
 * filters hide everything" (offer to clear them). `title` and `description` replace the default
 * text when the list's state needs its own words ("No TechPacks are waiting for review.").
 *
 * @example
 * <ListEmptyState noun="leads" :filtered="list.isFiltered.value" @clear="list.clearFilters" />
 */
const props = defineProps<{
  /** Plural, lower case: "leads". */
  noun: string
  /** A filter or search is hiding rows (`useListQuery().isFiltered`). */
  filtered?: boolean
  title?: string
  description?: string
  /** The create button's label. Leave out where staff can't create. */
  createLabel?: string
}>()

const emit = defineEmits<{ create: [], clear: [] }>()

const actions = computed<ButtonProps[]>(() => {
  if (props.filtered) return [{ label: 'Clear filters', color: 'neutral', variant: 'outline', onClick: () => emit('clear') }]
  if (props.createLabel) return [{ label: props.createLabel, icon: 'lucide:plus', onClick: () => emit('create') }]
  return []
})
</script>

<template>
  <UEmpty
    :icon="filtered ? 'lucide:search-x' : 'lucide:inbox'"
    :title="title ?? (filtered ? `No ${noun} match your filters` : `No ${noun} yet`)"
    :description="description ?? (filtered ? 'Try a different search, or clear the filters.' : undefined)"
    :actions="actions"
    variant="naked"
  />
</template>
