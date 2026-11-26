<script lang="ts">
/** @public A row of the grid, for screens that build its `items`. */
export interface DetailItem {
  label: string
  /** A missing value shows as a dash. */
  value: string | null | undefined
}
</script>

<script setup lang="ts">
/**
 * A record's facts as label-over-value pairs: one column on a phone, two from `sm`. For a
 * read-only record in a slideover or card. Values are plain text; a fact that needs a badge or a
 * link is written out beside the grid instead.
 *
 * @example
 * <DetailGrid :items="[{ label: 'Company', value: lead.company }]" />
 */
defineProps<{ items: DetailItem[] }>()
</script>

<template>
  <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="item in items"
      :key="item.label"
      class="min-w-0"
    >
      <dt class="text-sm text-muted">
        {{ item.label }}
      </dt>
      <dd class="mt-0.5 wrap-anywhere text-highlighted">
        {{ item.value || NO_VALUE }}
      </dd>
    </div>
  </dl>
</template>
