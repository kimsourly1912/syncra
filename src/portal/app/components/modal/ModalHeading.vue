<script setup lang="ts">
import type { NuxtUIColor } from '@/types/nuxt-ui'

defineProps<{
  icon?: string
  title?: string
  description?: string
  color?: NuxtUIColor
}>()

const elementClass = {
  description: tw`text-muted mt-3`,
  title: tw`text-2xl text-highlighted font-semibold`,
}
</script>

<template>
  <section class="flex flex-col items-center gap-4">
    <slot name="icon">
      <template v-if="icon">
        <BaseIcon
          :color
          :name="icon"
          size="lg"
          variant="soft"
        />
      </template>
    </slot>
    <section class="text-center">
      <slot
        name="title"
        :item="elementClass"
      >
        <h1 :class="elementClass.title">
          {{ title }}
        </h1>
      </slot>

      <slot
        name="description"
        :item="elementClass"
      >
        <p :class="elementClass.description">
          {{ description }}
        </p>
      </slot>
    </section>
  </section>
</template>
