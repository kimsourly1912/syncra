<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { workbook, inspection, actions } = useReviewDetail()
const { staged, discardEdits } = workbook
const { confirmed, canEdit, canConfirm, approvalBlocker, savingCorrections, approving } = actions
const canApprove = computed(() => canConfirm.value && confirmed.value)
const reasonId = useId()
</script>

<template>
  <footer class="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-default bg-default px-3 py-2">
    <template v-if="staged.length || savingCorrections">
      <p
        aria-live="polite"
        class="flex items-center gap-2 text-sm font-semibold text-highlighted"
      >
        <UIcon
          name="lucide:circle"
          class="size-3 shrink-0 fill-primary text-primary"
        />
        {{ savingCorrections ? 'Saving corrections…' : `${staged.length} unsaved ${staged.length === 1 ? 'correction' : 'corrections'}` }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Discard changes"
          color="neutral"
          variant="ghost"
          :disabled="!canEdit"
          @click="discardEdits"
        />
        <UButton
          :label="staged.length > 1 ? 'Save corrections' : 'Save correction'"
          :disabled="!canEdit"
          :loading="savingCorrections"
          @click="actions.saveCorrections"
        />
      </div>
    </template>

    <template v-else>
      <UCheckbox
        v-if="canConfirm || approving"
        v-model="confirmed"
        label="I verified the critical values and required rows and sizes against the source PDF."
        :disabled="!canConfirm"
      />
      <p
        v-else
        :id="reasonId"
        role="status"
        class="flex items-center gap-2 text-sm text-highlighted"
      >
        <UIcon
          v-if="inspection.blocksApproval.value"
          name="lucide:lock"
          class="size-4 shrink-0 text-error"
        />
        {{ approvalBlocker }}
      </p>
      <UButton
        label="Approve and release"
        icon="lucide:check"
        :color="canApprove ? 'primary' : 'neutral'"
        :variant="canApprove ? 'solid' : 'soft'"
        :disabled="!canApprove"
        :loading="approving"
        :aria-describedby="canConfirm || approving ? undefined : reasonId"
        @click="actions.approve"
      />
    </template>
  </footer>
</template>
