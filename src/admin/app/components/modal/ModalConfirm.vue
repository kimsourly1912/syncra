<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Are you sure?',
})

const emits = defineEmits<{
  cancel: []
  confirm: []
}>()

const model = defineModel<boolean>()

function onCancel() {
  model.value = false
  emits('cancel')
}
</script>

<template>
  <UModal v-model:open="model">
    <template #content>
      <main class="p-8 space-y-7.5 text-center">
        <h1 class="text-highlighted text-[28px]">
          {{ title }}
        </h1>
        <p class="text-secondary text-xl">
          <slot name="description">
            {{ description }}
          </slot>
        </p>
        <footer class="flex items-center gap-5">
          <UButton
            label="Cancel"
            block
            variant="outline"
            color="error"
            size="xl"
            @click="onCancel"
          />
          <UButton
            label="Confirm"
            block
            size="xl"
            @click="$emit('confirm')"
          />
        </footer>
      </main>
    </template>
  </UModal>
</template>
