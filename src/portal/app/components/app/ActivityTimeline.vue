<script setup lang="ts">
import type { ActivityLogDTO } from '@/types/dto'

interface Props {
  entries: ActivityLogDTO.ActivityLogEntry[]
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
})

// Size configurations matching UTimeline
const sizeConfig = {
  sm: {
    indicator: 'size-6',
    iconSize: 'w-3 h-3',
    wrapper: 'mt-1 pb-6',
  },
  md: {
    indicator: 'size-7',
    iconSize: 'w-3.5 h-3.5',
    wrapper: 'mt-1.5 pb-6.5',
  },
  lg: {
    indicator: 'size-8',
    iconSize: 'w-4 h-4',
    wrapper: 'mt-2 pb-7',
  },
  xl: {
    indicator: 'size-9',
    iconSize: 'w-4.5 h-4.5',
    wrapper: 'mt-2.5 pb-7.5',
  },
}

const config = computed(() => sizeConfig[props.size])
</script>

<template>
  <!-- Root: matches 'flex gap-1.5 flex-col' -->
  <div class="flex gap-1.5 flex-col">
    <div
      v-for="(entry, index) in entries"
      :key="entry.id"
      class="group relative flex flex-1 gap-3"
    >
      <!-- Container: matches 'relative flex items-center gap-1.5 flex-col' -->
      <div class="relative flex items-center gap-1.5 flex-col">
        <!-- Indicator -->
        <div
          :class="[
            'mt-1',
            config.indicator,
            'rounded-full bg-elevated flex items-center justify-center shrink-0'
          ]"
        >
          <UIcon
            name="lucide:file-text"
            :class="[config.iconSize]"
          />
        </div>

        <!-- Separator -->
        <div
          v-if="index < entries.length - 1"
          class="flex-1 w-0.5 rounded-full bg-elevated"
        />
      </div>

      <!-- Wrapper: matches 'w-full mt-2 pb-7' for lg -->
      <div :class="['w-full', config.wrapper]">
        <slot
          name="item"
          :entry="entry"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>
