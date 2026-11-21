<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { workbookCellKey, findingColumn } from '../utils/findings'
import type { ReviewFinding } from '../utils/findings'

const { inspection: draft, workbook, actions, showFinding } = useReviewDetail()
const { inspection, pending, error, findings, pdfFindings, aiFindings } = draft
const { selection, edits, originalValue, findingLocation, stage, undo } = workbook
const { canEdit } = actions

const sourceCheck = computed(() => inspection.value?.sourceCheck)
const aiReview = computed(() => inspection.value?.aiReview)

function findingLabel(finding: ReviewFinding) {
  return `${finding.measurement || 'Measurement'} · ${findingColumn(finding)}`
}

function useAllPdfValues() {
  for (const finding of pdfFindings.value) stage(finding, finding.referenceValue)
}
</script>

<template>
  <section
    aria-label="Findings"
    class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-default"
  >
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-2">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="lucide:scan-search"
          class="size-4 text-primary"
        />
        Findings
      </h2>
      <UButton
        v-if="pdfFindings.length > 1"
        label="Use all PDF values"
        icon="lucide:copy-check"
        size="sm"
        variant="soft"
        :disabled="!canEdit"
        @click="useAllPdfValues"
      />
    </header>

    <div class="min-h-0 space-y-3 p-3 @min-[72rem]:overflow-y-auto">
      <p
        v-if="pending && !inspection"
        class="text-sm text-muted"
        role="status"
      >
        Checking the workbook…
      </p>
      <p
        v-else-if="error && !inspection"
        class="text-sm text-muted"
      >
        Findings are unavailable until the workbook preview loads.
      </p>

      <template v-if="inspection">
        <div
          v-if="sourceCheck?.blocksApproval && !pdfFindings.length"
          class="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-highlighted"
          role="status"
        >
          Workbook layout issues need to be resolved before approval.
        </div>

        <ul
          v-if="findings.length"
          class="max-h-48 space-y-2 overflow-y-auto p-0.5"
          aria-label="Workbook findings"
        >
          <li
            v-for="finding in findings"
            :key="finding.id"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md border border-default px-3 py-2 text-start hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
              :class="{ 'bg-elevated ring-2 ring-inset ring-primary': selection?.id === finding.id }"
              :aria-pressed="selection?.id === finding.id"
              @click="showFinding(finding)"
            >
              <span class="min-w-0 flex-1 space-y-1">
                <UBadge
                  :label="finding.origin === 'pdf' ? 'PDF difference' : 'AI flag'"
                  :color="finding.origin === 'pdf' ? 'warning' : 'neutral'"
                  variant="subtle"
                  size="sm"
                />
                <span class="block text-sm font-semibold text-highlighted">{{ findingLabel(finding) }}</span>
                <span
                  v-if="findingLocation(finding) || finding.sourcePage"
                  class="block text-xs text-muted"
                >
                  {{ [findingLocation(finding), finding.sourcePage ? `PDF page ${finding.sourcePage}` : ''].filter(Boolean).join(' · ') }}
                </span>
              </span>
              <UIcon
                name="lucide:chevron-right"
                class="size-4 shrink-0 text-muted"
              />
            </button>
          </li>
        </ul>
        <p
          v-else
          class="text-sm font-medium text-highlighted"
        >
          {{ sourceCheck?.verified ? 'No differences found' : 'No cell differences listed' }}
        </p>

        <div
          v-if="selection"
          class="space-y-3 border-t border-default pt-3"
        >
          <h3 class="text-sm font-semibold text-highlighted">
            {{ findingLabel(selection) }}
          </h3>
          <dl class="grid grid-cols-2 gap-2 text-sm">
            <div class="min-w-0 rounded-md bg-elevated px-2 py-1.5">
              <dt class="text-muted">
                {{ selection.origin === 'pdf' ? 'PDF' : 'AI read' }}
              </dt>
              <dd class="font-semibold wrap-anywhere text-highlighted">
                {{ selection.referenceValue || 'Blank' }}
              </dd>
            </div>
            <div class="min-w-0 rounded-md bg-elevated px-2 py-1.5">
              <dt class="text-muted">
                Workbook
              </dt>
              <dd class="font-semibold wrap-anywhere text-highlighted">
                {{ originalValue(selection) || 'Blank' }}
              </dd>
            </div>
          </dl>
          <UFormField
            label="Corrected value"
            name="techpack-inline-value"
          >
            <UInput
              :model-value="edits.get(workbookCellKey(selection)) ?? originalValue(selection)"
              :disabled="!canEdit"
              :maxlength="64"
              autocomplete="off"
              class="w-full"
              @update:model-value="stage(selection, String($event))"
            />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="selection.origin === 'pdf'"
              :label="selection.referenceValue ? 'Use PDF value' : 'Use blank from PDF'"
              size="sm"
              variant="soft"
              :disabled="!canEdit"
              @click="stage(selection, selection.referenceValue)"
            />
            <UButton
              v-if="edits.has(workbookCellKey(selection))"
              label="Undo change"
              size="sm"
              color="neutral"
              variant="ghost"
              :disabled="!canEdit"
              @click="undo(selection)"
            />
          </div>
        </div>

        <div class="space-y-2 border-t border-default pt-3 text-sm text-muted">
          <div class="space-y-1">
            <p v-if="sourceCheck?.comparedCells">
              Compared {{ sourceCheck.comparedCells }} size and tolerance cells with the PDF.
            </p>
            <p v-else-if="!sourceCheck">
              Source comparison unavailable. Verify the workbook against the PDF.
            </p>
            <p
              v-for="note in sourceCheck?.notes"
              :key="note"
            >
              {{ note }}
            </p>
          </div>
          <div
            v-if="aiReview"
            class="space-y-1"
          >
            <h3 class="font-medium text-highlighted">
              Second AI review
            </h3>
            <p v-if="aiReview.comparedCells">
              Compared {{ aiReview.comparedCells }} size and tolerance cells.
              <template v-if="!aiFindings.length">
                No differences in the cells it compared.
              </template>
            </p>
            <p
              v-for="note in aiReview.notes"
              :key="note"
            >
              {{ note }}
            </p>
            <p>Verify any AI flags against the source PDF.</p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
