<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <section class="space-y-4">
    <slot name="header">
      <section class="flex flex-wrap gap-4 items-center justify-between">
        <slot name="prefix">
          <LayoutHeading
            :title
            :description
          />
        </slot>
        <slot name="suffix" />
      </section>
    </slot>

    <slot />
  </section>
</template>
