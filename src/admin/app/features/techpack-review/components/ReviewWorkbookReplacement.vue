<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const open = defineModel<boolean>('open', { required: true })

const { actions } = useReviewDetail()
const { replacement, busy, savingReplacement } = actions

watch(open, (isOpen) => {
  if (!isOpen) actions.setReplacement(null)
})

function chooseFile(event: Event) {
  actions.setReplacement((event.currentTarget as HTMLInputElement).files?.[0] ?? null)
}

async function save() {
  if (await actions.saveReplacement()) open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Replace workbook"
    description="Upload a corrected workbook, then verify the new draft against the source PDF."
    :dismissible="!busy"
    :close="!busy"
  >
    <template #body>
      <UFormField
        label="Corrected workbook (.xlsx)"
        name="corrected-workbook"
      >
        <UInput
          type="file"
          accept=".xlsx"
          class="w-full"
          :disabled="busy"
          @change="chooseFile"
        />
      </UFormField>
    </template>
    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="busy"
          @click="open = false"
        />
        <UButton
          label="Save corrected workbook"
          icon="lucide:upload"
          :disabled="busy || !replacement"
          :loading="savingReplacement"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>
