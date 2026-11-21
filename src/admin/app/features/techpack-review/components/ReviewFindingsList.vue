<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { editKey, findingColumn } from '../utils/findings'

const { inspection: draft, actions, showFinding } = useReviewDetail()
const { findings, pdfFindings, aiFindings, activeFinding, edits, stage, undo, useAllPdfValues, findingLocation } = draft
const { busy, replacement } = actions
</script>

<template>
  <div class="border-b border-warning/20 bg-warning/5 px-4 py-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon
          name="lucide:triangle-exclamation-point"
          class="size-4 text-warning"
        />
        <template v-if="aiFindings.length">
          {{ aiFindings.length }} {{ aiFindings.length === 1 ? 'possible difference' : 'possible differences' }} flagged by AI
        </template>
        <template v-else>
          {{ pdfFindings.length }} {{ pdfFindings.length === 1 ? 'difference' : 'differences' }} from the PDF
        </template>
      </h3>
      <UButton
        v-if="pdfFindings.length > 1"
        label="Use all PDF values"
        icon="lucide:copy-check"
        size="sm"
        variant="soft"
        :disabled="busy || !!replacement"
        @click="useAllPdfValues"
      />
    </div>
    <ul class="mt-2 grid max-h-32 gap-2 overflow-auto pr-1">
      <li
        v-for="finding in findings"
        :key="editKey(finding)"
      >
        <button
          type="button"
          class="flex w-full flex-wrap items-start gap-x-3 gap-y-1 rounded-md border border-warning/25 bg-default px-3 py-2 text-left hover:bg-warning/10 focus-visible:outline-2 focus-visible:outline-primary"
          :aria-pressed="activeFinding === finding"
          :class="{ 'ring-1 ring-primary': activeFinding === finding }"
          @click="showFinding(finding)"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-highlighted">
              {{ finding.measurement }} · {{ findingColumn(finding) }}
            </span>
            <span class="block text-sm text-muted">
              {{ finding.origin === 'ai' ? 'AI read' : 'PDF' }} {{ finding.referenceValue || 'blank' }} · Workbook {{ finding.workbookValue || 'blank' }}
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-1 text-xs font-medium text-muted">
            {{ findingLocation(finding) }}
            <template v-if="finding.sourcePage">
              · {{ finding.origin === 'ai' ? 'AI cited page' : 'PDF page' }} {{ finding.sourcePage }}
            </template>
            <UIcon
              name="lucide:pencil"
              class="size-4"
            />
          </span>
        </button>
      </li>
    </ul>
    <div
      v-if="activeFinding"
      class="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-default bg-default px-3 py-2.5"
    >
      <div class="min-w-0 space-y-1">
        <label
          for="techpack-inline-value"
          class="block text-sm font-semibold text-highlighted"
        >
          Correct {{ activeFinding.measurement }} · {{ findingColumn(activeFinding) }}
        </label>
        <input
          id="techpack-inline-value"
          type="text"
          maxlength="64"
          autocomplete="off"
          class="w-full max-w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
          :value="edits.get(editKey(activeFinding)) ?? activeFinding.workbookValue"
          :disabled="busy || !!replacement"
          @input="stage(activeFinding, ($event.target as HTMLInputElement).value)"
        >
      </div>
      <UButton
        v-if="activeFinding.origin === 'pdf'"
        :label="activeFinding.referenceValue ? 'Use PDF value' : 'Use blank from PDF'"
        size="sm"
        variant="soft"
        :disabled="busy || !!replacement"
        @click="stage(activeFinding, activeFinding.referenceValue)"
      />
      <UButton
        v-if="edits.has(editKey(activeFinding))"
        label="Undo change"
        size="sm"
        color="neutral"
        variant="ghost"
        :disabled="busy"
        @click="undo(activeFinding)"
      />
    </div>
  </div>
</template>
