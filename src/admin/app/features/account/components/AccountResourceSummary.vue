<script setup lang="ts">
defineProps<{
  heading: string
  metrics: { label: string, value: number, emphasized?: boolean }[]
}>()

defineSlots<{
  'actions': () => unknown
  'metric-detail'?: (props: { label: string }) => unknown
}>()
</script>

<template>
  <UCard
    as="section"
    :aria-label="heading"
    :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'p-4 sm:p-5' }"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ heading }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <slot name="actions" />
        </div>
      </div>
    </template>
    <dl class="grid grid-cols-1 gap-4 @min-[21rem]:grid-cols-3 @min-[21rem]:gap-0 @min-[21rem]:divide-x @min-[21rem]:divide-default">
      <div
        v-for="metric in metrics"
        :key="metric.label"
        class="min-w-0 @min-[21rem]:px-2.5 @min-[34rem]:px-4 @min-[21rem]:first:ps-0 @min-[21rem]:last:pe-0"
      >
        <dt class="text-xs text-muted @min-[34rem]:text-sm">
          {{ metric.label }}
        </dt>
        <dd
          class="text-xl font-semibold tabular-nums @min-[34rem]:text-2xl"
          :class="metric.emphasized ? 'text-primary' : 'text-highlighted'"
        >
          {{ formatCount(metric.value) }}
        </dd>
        <slot
          name="metric-detail"
          :label="metric.label"
        />
      </div>
    </dl>
  </UCard>
</template>
