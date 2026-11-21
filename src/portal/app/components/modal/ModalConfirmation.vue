<script setup lang="ts">
import type { NuxtUIColor } from '@/types/nuxt-ui'

export interface ModalConfirmationProps {
  icon?: string
  title?: string
  description?: string
  labelLeft?: string
  labelRight?: string
  loading?: boolean
  color?: NuxtUIColor
}

withDefaults(defineProps<ModalConfirmationProps>(), {
  color: 'neutral',
  labelLeft: 'Cancel',
  labelRight: 'Confirm',
})

defineEmits<{
  left: []
  right: []
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal
    v-model:open="model"
    class="p-6"
  >
    <template #title />
    <template #description />
    <template #content="{ close }">
      <main>
        <ModalHeading
          :title
          :description
          :icon
          :color
        />

        <footer class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-10">
          <UButton
            :label="labelLeft"
            color="neutral"
            variant="outline"
            block
            :disabled="loading"
            @click="() => {
              close()
              $emit('left')
            }"
          />
          <UButton
            :label="labelRight"
            block
            :loading
            :color
            @click="$emit('right')"
          />
        </footer>
      </main>
    </template>
  </UModal>
</template>
