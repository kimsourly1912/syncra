<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { inspection: draft, actions } = useReviewDetail()
const { staged, blocksApproval, discardEdits } = draft
const { confirmed, replacement, workbookInput, busy, canConfirm, chooseReplacement, saveReplacement, saveCorrections, approve } = actions
</script>

<template>
  <details class="rounded-lg border border-default bg-default px-4 py-3">
    <summary class="cursor-pointer text-sm font-semibold text-highlighted">
      Replace workbook
    </summary>
    <div class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
      <div class="min-w-0 space-y-1">
        <label
          for="corrected-workbook"
          class="block text-sm font-semibold text-highlighted"
        >Corrected workbook (.xlsx)</label>
        <input
          id="corrected-workbook"
          ref="workbookInput"
          type="file"
          accept=".xlsx"
          class="block w-full max-w-80 rounded-md border border-default bg-default text-sm text-muted file:mr-3 file:border-0 file:bg-elevated file:px-3 file:py-2"
          :disabled="busy || !!staged.length"
          @change="chooseReplacement"
        >
      </div>
      <UButton
        v-if="replacement"
        label="Save corrected workbook"
        icon="lucide:upload"
        variant="subtle"
        :loading="busy"
        @click="saveReplacement"
      />
    </div>
  </details>

  <footer class="space-y-3 rounded-lg border border-default bg-default px-4 py-3 shadow-sm lg:sticky lg:bottom-0 lg:z-10">
    <div
      v-if="staged.length"
      class="flex w-full flex-wrap items-center justify-between gap-2 border-b border-default pb-3"
    >
      <span
        aria-live="polite"
        class="text-sm font-semibold text-highlighted"
      >
        {{ staged.length }} unsaved {{ staged.length === 1 ? 'correction' : 'corrections' }}
      </span>
      <div class="flex gap-2">
        <UButton
          label="Discard changes"
          color="neutral"
          variant="ghost"
          :disabled="busy"
          @click="discardEdits"
        />
        <UButton
          label="Save corrections"
          icon="lucide:save"
          :loading="busy"
          @click="saveCorrections"
        />
      </div>
    </div>
    <p
      v-if="blocksApproval"
      class="w-full text-sm font-medium text-warning"
    >
      Resolve the PDF differences or workbook layout issues shown above before approving.
    </p>
    <div class="flex w-full flex-wrap items-center justify-between gap-4">
      <UCheckbox
        v-model="confirmed"
        label="I verified the critical values and required rows and sizes against the source PDF."
        :disabled="!canConfirm"
      />
      <div class="flex shrink-0 gap-2">
        <UButton
          label="Approve and release"
          icon="lucide:check"
          :disabled="!canConfirm || !confirmed"
          :loading="busy"
          @click="approve"
        />
      </div>
    </div>
  </footer>
</template>
