<script setup lang="ts">
defineProps<{
  title: string
  username: string
  editable: boolean
  to: string
}>()

defineEmits<{
  edit: []
}>()
</script>

<template>
  <header class="space-y-3">
    <span class="text-dimmed font-medium text-sm">Step 2 of 2</span>
    <h1 class="text-3xl font-semibold text-highlighted">
      {{ title }}
    </h1>
    <section class="text-sm">
      <p class="text-muted text">
        We've sent a verification code to:
      </p>
      <div>
        <span class="font-medium">
          {{ username }}
        </span>
        <UButton
          v-if="editable"
          label="Edit"
          color="info"
          variant="link"
          class="underline"
          :to
          @click="$emit('edit')"
        />
      </div>
    </section>
  </header>
</template>
