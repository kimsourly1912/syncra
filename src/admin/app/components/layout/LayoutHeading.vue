<script setup lang="ts">
defineProps<{
  to?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex items-center justify-between gap-4 flex-wrap">
    <section>
      <ULink
        :to
        class="flex items-center gap-4"
      >
        <UIcon
          v-if="to"
          name="lucide:arrow-left"
          class="text-2xl min-w-6 text-primary"
        />
        <h1 class="text-left text-highlighted text-2xl font-medium">
          {{ title }}
        </h1>
      </ULink>
      <p
        v-if="description"
        class="text-muted mt-1"
      >
        {{ description }}
      </p>
    </section>
    <section class="flex gap-4 flex-wrap">
      <slot name="suffix" />
    </section>
  </header>
</template>
