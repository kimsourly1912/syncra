<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { findingLabel } from '../utils/findings'
import type { ReviewFinding } from '../utils/findings'

const { inspection: draft, workbook, actions, showFinding } = useReviewDetail()
const { inspection, findings, pdfFindings, blocksApproval } = draft
const open = ref(false)

const layoutBlocked = computed(() => !!inspection.value?.sourceCheck?.blocksApproval && !pdfFindings.value.length)
const issueCount = computed(() => findings.value.length + Number(layoutBlocked.value))

function selectFinding(finding: ReviewFinding) {
  showFinding(finding)
  open.value = false
}

function useAllPdfValues() {
  for (const finding of pdfFindings.value) workbook.stage(finding, finding.referenceValue)
  open.value = false
}
</script>

<template>
  <UPopover
    v-if="issueCount"
    v-model:open="open"
    :content="{ align: 'start' }"
  >
    <UButton
      :label="`Review issues (${issueCount})`"
      variant="outline"
      size="sm"
      :disabled="actions.busy.value"
    />

    <template #content>
      <div class="w-72 max-w-[calc(100vw-1rem)] space-y-2 p-2">
        <p
          v-if="layoutBlocked"
          class="rounded-md bg-warning/10 px-3 py-2 text-sm text-highlighted"
        >
          Workbook layout issues need to be resolved before approval.
        </p>
        <ul
          v-if="findings.length"
          class="max-h-72 space-y-1 overflow-y-auto p-0.5"
          aria-label="Workbook findings"
        >
          <li
            v-for="finding in findings"
            :key="finding.id"
          >
            <button
              type="button"
              class="w-full space-y-1 rounded-md px-3 py-2 text-start hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
              :class="{ 'bg-elevated': workbook.selection.value?.id === finding.id }"
              :aria-pressed="workbook.selection.value?.id === finding.id"
              @click="selectFinding(finding)"
            >
              <UBadge
                :label="finding.origin === 'pdf' ? 'PDF difference' : 'AI flag'"
                :color="finding.origin === 'pdf' ? 'warning' : 'neutral'"
                variant="subtle"
                size="sm"
              />
              <span class="block text-sm font-semibold text-highlighted">{{ findingLabel(finding) }}</span>
              <span
                v-if="workbook.findingLocation(finding)"
                class="block text-xs text-muted"
              >{{ workbook.findingLocation(finding) }}</span>
            </button>
          </li>
        </ul>
        <UButton
          v-if="pdfFindings.length > 1"
          label="Use all PDF values"
          icon="lucide:copy-check"
          variant="soft"
          size="sm"
          :disabled="!actions.canEdit.value"
          @click="useAllPdfValues"
        />
      </div>
    </template>
  </UPopover>
  <span
    v-else-if="inspection?.sourceCheck?.verified && !blocksApproval"
    class="flex items-center gap-1 px-2 text-sm text-muted"
  >
    <UIcon
      name="lucide:circle-check"
      class="size-4 text-success"
    />
    No issues found
  </span>
</template>
