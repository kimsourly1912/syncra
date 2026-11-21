<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

const emits = defineEmits<{
  close: []
}>()

function onClose() {
  model.value = false
  emits('close')
}
</script>

<template>
  <UModal
    v-model:open="model"
    :ui="{ header: 'min-h-auto border-none', close: 'hidden' }"
  >
    <template #title />
    <template #description />
    <template #body>
      <div class="w-full flex flex-col items-center justify-center text-center py-10 p-5">
        <NuxtImg
          class="w-20 mb-6"
          src="/img/message.png"
        />
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Thank you for reach out to us!
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-xl">
          Our team has received your request and will reach out to you shortly to discuss next steps.
        </p>
        <div class="py-5">
          <UButton
            class="px-15"
            color="neutral"
            variant="outline"
            size="xl"
            label="Return"
            @click="onClose"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
