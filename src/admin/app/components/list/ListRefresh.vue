<script setup lang="ts">
/**
 * Wraps content that is reloading behind what's on screen (`useApiQuery().refreshing`): a thin
 * moving bar on its top edge, and the content dimmed until the new data arrives. Nothing moves; a
 * reload under 150 ms shows nothing (`useRefreshIndicator`). Screen readers hear "Updating…".
 * Use it for reloads only: a first load shows skeletons instead.
 *
 * @example
 * <ListRefresh :active="refreshing"><UCard>…rows…</UCard></ListRefresh>
 */
const props = defineProps<{ active: boolean }>()
const shown = useRefreshIndicator(() => props.active)
</script>

<template>
  <div class="relative">
    <UProgress
      v-if="shown"
      size="2xs"
      class="absolute inset-x-0 top-0 z-10"
      :ui="{ base: 'rounded-none bg-transparent', indicator: 'rounded-none' }"
      aria-hidden="true"
    />
    <div
      class="transition-opacity duration-150 motion-reduce:transition-none"
      :class="shown && 'opacity-60'"
    >
      <slot />
    </div>
    <span
      role="status"
      class="sr-only"
    >{{ shown ? 'Updating…' : '' }}</span>
  </div>
</template>
