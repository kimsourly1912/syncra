<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal
    v-model:open="model"
    title="Contact Sales"
    description="A member of our team will be in touch soon."
    class="max-w-3xl"
    scrollable
    :ui="{
      header: 'min-h-auto',
    }"
  >
    <template #body>
      <slot />
    </template>
  </UModal>
</template>
