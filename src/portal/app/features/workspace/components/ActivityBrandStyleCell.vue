<script setup lang="ts">
import type { DocAIDTO } from '@/types/dto'
import { activityBrandStyles } from '../utils/activity-brand-styles'

const props = defineProps<{
  brandStyles?: DocAIDTO.BrandStylePair[] | null
  status: DocAIDTO.DocAIJobStatus
}>()

const pairs = computed(() => activityBrandStyles(props.brandStyles, props.status))
const firstPair = computed(() => pairs.value[0])
</script>

<template>
  <div
    v-if="firstPair"
    class="flex max-w-96 items-center gap-2 whitespace-nowrap"
  >
    <span
      class="min-w-0 max-w-64 truncate"
      :title="`${firstPair.brand ?? 'N/A'} / ${firstPair.style ?? 'N/A'}`"
    >
      <span class="font-medium text-highlighted">{{ firstPair.brand ?? 'N/A' }}</span>
      <span class="text-muted"> / {{ firstPair.style ?? 'N/A' }}</span>
    </span>

    <UPopover
      v-if="pairs.length > 1"
      :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        class="shrink-0"
        :label="`+${pairs.length - 1} more`"
        :aria-label="`Show all ${pairs.length} Brand and Style pairs`"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      />

      <template #content>
        <div
          class="max-w-[calc(100vw-2rem)] p-3"
          @click.stop
          @keydown.enter.stop
          @keydown.space.stop
        >
          <p class="mb-2 text-sm font-semibold text-highlighted">
            Brand / Style
          </p>
          <ul
            aria-label="All Brand and Style pairs"
            class="max-h-64 max-w-md space-y-2 overflow-auto text-sm"
          >
            <li
              v-for="(pair, index) in pairs"
              :key="index"
              class="whitespace-nowrap"
            >
              <span class="font-medium text-highlighted">{{ pair.brand ?? 'N/A' }}</span>
              <span class="text-muted"> / {{ pair.style ?? 'N/A' }}</span>
            </li>
          </ul>
        </div>
      </template>
    </UPopover>
  </div>
  <span
    v-else
    class="text-muted"
  >N/A</span>
</template>
