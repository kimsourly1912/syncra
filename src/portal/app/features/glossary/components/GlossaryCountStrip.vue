<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'

const props = defineProps<{
  counts: GlossaryDTO.GlossaryCounts
  compact?: boolean
}>()

const { t } = useI18n()

const items = computed(() => [
  {
    key: 'added',
    value: props.counts.added,
    label: t('glossary.counts.added'),
    icon: 'lucide:plus',
    class: 'border-success/25 bg-success/5 text-success',
  },
  {
    key: 'changed',
    value: props.counts.changed,
    label: t('glossary.counts.changed'),
    icon: 'lucide:refresh-cw',
    class: 'border-warning/25 bg-warning/5 text-warning',
  },
  {
    key: 'removed',
    value: props.counts.removed,
    label: t('glossary.counts.removed'),
    icon: 'lucide:minus',
    class: 'border-error/25 bg-error/5 text-error',
  },
  {
    key: 'unchanged',
    value: props.counts.unchanged,
    label: t('glossary.counts.unchanged'),
    icon: 'lucide:equal',
    class: 'border-default bg-elevated/60 text-muted',
  },
])
</script>

<template>
  <dl
    class="grid grid-cols-2 gap-2"
    :class="compact ? 'sm:grid-cols-4' : 'lg:grid-cols-4'"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="rounded-xl border px-3 py-3"
      :class="item.class"
    >
      <dt class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em]">
        <UIcon
          :name="item.icon"
          class="size-3.5"
        />
        {{ item.label }}
      </dt>
      <dd class="mt-1 font-mono text-2xl font-semibold tabular-nums text-highlighted">
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
