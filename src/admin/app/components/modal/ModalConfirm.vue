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
  <UModal
    v-model:open="model"
    :title
    :description
  >
    <template
      v-if="$slots.description"
      #description
    >
      <slot name="description" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancel"
          variant="outline"
          color="neutral"
          @click="onCancel"
        />
        <UButton
          label="Confirm"
          color="error"
          @click="emits('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
