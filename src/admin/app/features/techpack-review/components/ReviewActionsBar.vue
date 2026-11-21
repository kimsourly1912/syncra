<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { workbook, actions } = useReviewDetail()
const { staged, discardEdits } = workbook
const { confirmed, canEdit, canConfirm, approvalBlocker, savingCorrections, approving } = actions
const canApprove = computed(() => canConfirm.value && confirmed.value)
const reason = computed(() => approvalBlocker.value || (confirmed.value ? '' : 'Check the verification box to enable approval.'))
const reasonId = useId()
</script>

<template>
  <footer class="shrink-0 space-y-2 rounded-lg border border-default bg-default px-3 py-2.5">
    <div
      v-if="staged.length"
      class="flex flex-wrap items-center justify-between gap-2 border-b border-default pb-2"
    >
      <span
        aria-live="polite"
        class="text-sm font-semibold text-highlighted"
      >
        {{ staged.length }} unsaved {{ staged.length === 1 ? 'correction' : 'corrections' }}
      </span>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Discard changes"
          color="neutral"
          variant="ghost"
          :disabled="!canEdit"
          @click="discardEdits"
        />
        <UButton
          label="Save corrections"
          icon="lucide:save"
          :disabled="!canEdit"
          :loading="savingCorrections"
          @click="actions.saveCorrections"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="space-y-1">
        <p
          v-if="reason"
          :id="reasonId"
          role="status"
          class="text-sm"
          :class="approvalBlocker ? 'font-medium text-highlighted' : 'text-muted'"
        >
          {{ reason }}
        </p>
        <UCheckbox
          v-model="confirmed"
          label="I verified the critical values and required rows and sizes against the source PDF."
          :disabled="!canConfirm"
          :aria-describedby="reason ? reasonId : undefined"
        />
      </div>
      <UButton
        label="Approve and release"
        icon="lucide:check"
        :color="canApprove ? 'primary' : 'neutral'"
        :variant="canApprove ? 'solid' : 'soft'"
        :disabled="!canApprove"
        :loading="approving"
        :aria-describedby="reason ? reasonId : undefined"
        @click="actions.approve"
      />
    </div>
  </footer>
</template>
