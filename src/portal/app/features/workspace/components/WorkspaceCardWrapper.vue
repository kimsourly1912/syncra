<script setup lang="ts">
import WorkspaceCardSkeleton from './WorkspaceCardSkeleton.vue'

withDefaults(defineProps<{
  pending?: boolean
  isEmpty: boolean
  pendingCount?: number
}>(), {
  pendingCount: 4,
})
</script>

<template>
  <template v-if="pending">
    <ul class="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      <WorkspaceCardSkeleton :length="pendingCount" />
    </ul>
  </template>
  <template v-else>
    <template v-if="isEmpty">
      <EmptyData />
    </template>
    <template v-else>
      <ul class="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <slot />
      </ul>
    </template>
  </template>
</template>
