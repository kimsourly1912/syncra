<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { workbook, inspection, actions } = useReviewDetail()
const { staged, discardEdits } = workbook
const { confirmed, canEdit, canConfirm, approvalBlocker, checklist, savingCorrections, approving } = actions
const canApprove = computed(() => canConfirm.value && confirmed.value)
const reasonId = useId()
const checklistId = useId()

const doneCount = computed(() => checklist.value.filter(check => check.done).length)

// The checklist already names what's missing, so the line beside Approve doesn't repeat it. Only a
// blocker the checklist can't show (an action still running) is spelled out.
const blockerText = computed(() => (checklist.value.every(check => check.done)
  ? approvalBlocker.value
  : 'Complete the checklist to approve.'))
// On a phone the checklist folds into one line until opened.
const expanded = ref(false)
</script>

<template>
  <footer class="flex min-h-14 shrink-0 flex-col gap-2 rounded-lg border border-default bg-default px-3 py-2">
    <div
      v-if="staged.length || savingCorrections"
      class="flex flex-wrap items-center justify-between gap-2"
    >
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
    </div>

    <template v-else>
      <UButton
        :label="`${doneCount} of ${checklist.length} checks done`"
        :trailing-icon="expanded ? 'lucide:chevron-down' : 'lucide:chevron-up'"
        :aria-expanded="expanded"
        :aria-controls="checklistId"
        color="neutral"
        variant="ghost"
        size="sm"
        class="self-start xl:hidden"
        @click="expanded = !expanded"
      />
      <ul
        :id="checklistId"
        aria-label="Approval checklist"
        :class="[expanded ? 'flex' : 'hidden', 'flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5 xl:flex']"
      >
        <li
          v-for="check in checklist"
          :key="check.id"
          class="flex items-center gap-1.5"
          :class="check.done && !check.warning ? 'text-muted' : 'text-highlighted'"
        >
          <UIcon
            v-if="check.inProgress"
            name="lucide:loader-circle"
            class="size-4 shrink-0 animate-spin text-muted"
          />
          <UIcon
            v-else-if="check.warning"
            name="lucide:triangle-alert"
            class="size-4 shrink-0 text-warning"
          />
          <UIcon
            v-else-if="check.done"
            name="lucide:circle-check"
            class="size-4 shrink-0 text-success"
          />
          <UIcon
            v-else
            name="lucide:circle-dashed"
            class="size-4 shrink-0 text-muted"
          />
          <span>
            <span class="sr-only">{{ check.done ? 'Done:' : 'To do:' }}</span>
            {{ check.label }}
          </span>
        </li>
      </ul>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-2">
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
          {{ blockerText }}
        </p>
        <UButton
          label="Approve and release"
          icon="lucide:check"
          :color="canApprove ? 'primary' : 'neutral'"
          :variant="canApprove ? 'solid' : 'soft'"
          :disabled="!canApprove"
          :loading="approving"
          :aria-describedby="canConfirm || approving ? undefined : `${reasonId} ${checklistId}`"
          @click="actions.approve"
        />
      </div>
    </template>
  </footer>
</template>
