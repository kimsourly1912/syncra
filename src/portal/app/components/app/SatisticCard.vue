<script setup lang="ts">
import type { NuxtUIColor } from '~/types/nuxt-ui'

export interface SatisticCardItem {
  label: string
  icon: string
  count: number
  color: NuxtUIColor
}

defineProps<{
  items: SatisticCardItem[]
  pending?: boolean
  pendingCount?: number
}>()
</script>

<template>
  <template v-if="pending">
    <USkeleton
      v-for="i in pendingCount"
      :key="i"
      class="h-32 border border-default"
    />
  </template>
  <template v-else>
    <li
      v-for="(o, idx) in items"
      :key="idx"
      class="p-4 bg-elevated/50 border border-default transition-all rounded-lg"
    >
      <section class="flex gap-4 items-center justify-between flex-wrap">
        <h1 class="font-semibold text-muted">
          {{ o.label }}
        </h1>
        <UBadge
          size="xl"
          :icon="o.icon"
          variant="subtle"
          :color="o.color"
        />
      </section>
      <span class="text-3xl inline-flex mt-6 font-semibold">{{ o.count }}</span>
    </li>
  </template>
</template>
