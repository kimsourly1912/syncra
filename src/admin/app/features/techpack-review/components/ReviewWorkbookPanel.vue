<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import ReviewFindingsList from './ReviewFindingsList.vue'
import ReviewWorkbookGrid from './ReviewWorkbookGrid.vue'

const { inspection: draft, actions } = useReviewDetail()
const { inspection, loading, error, aiFindings, findings, sheet } = draft
const { busy } = actions
</script>

<template>
  <div class="flex min-w-0 flex-col">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-default px-4 py-2.5">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="lucide:sheet"
          class="size-5 text-primary"
        />
        Draft workbook
      </h2>
      <UButton
        label="Download workbook"
        icon="lucide:download"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="busy"
        @click="actions.download('draft')"
      />
    </div>

    <div
      v-if="inspection"
      class="flex min-w-0 flex-1 flex-col"
    >
      <div
        v-if="inspection.sourceCheck?.verified"
        class="flex items-start gap-2.5 border-b border-success/20 bg-success/5 px-4 py-3"
        role="status"
      >
        <UIcon
          name="lucide:circle-check"
          class="mt-0.5 size-4 shrink-0 text-success"
        />
        <div class="text-sm">
          <p class="font-semibold text-highlighted">
            No differences found
          </p>
          <p class="text-muted">
            All {{ inspection.sourceCheck.comparedCells }} size and tolerance cells match the PDF.
            This workbook is already in review and needs admin approval to release.
          </p>
        </div>
      </div>
      <div
        v-else-if="inspection.sourceCheck"
        class="space-y-1 border-b border-default px-4 py-3 text-sm text-muted"
      >
        <p v-if="inspection.sourceCheck.comparedCells">
          Compared {{ inspection.sourceCheck.comparedCells }} size and tolerance cells with the PDF.
        </p>
        <p
          v-for="note in inspection.sourceCheck.notes"
          :key="note"
          class="text-highlighted"
        >
          {{ note }}
        </p>
      </div>
      <p
        v-else
        class="border-b border-default px-4 py-3 text-sm text-muted"
      >
        Source comparison unavailable. Verify the workbook against the PDF.
      </p>
      <div
        v-if="inspection.aiReview"
        class="space-y-1 border-b border-default px-4 py-3 text-sm text-muted"
        role="status"
      >
        <p class="flex items-center gap-2 font-semibold text-highlighted">
          <UIcon
            name="lucide:scan-search"
            class="size-4 text-primary"
          />
          Second AI review
        </p>
        <p v-if="inspection.aiReview.comparedCells">
          The AI read the original PDF and compared {{ inspection.aiReview.comparedCells }} size and tolerance cells with the workbook.
          <template v-if="!aiFindings.length">
            No differences in the cells it compared.
          </template>
        </p>
        <p
          v-for="note in inspection.aiReview.notes"
          :key="note"
        >
          {{ note }}
        </p>
        <p>Verify the workbook against the source PDF before approving release.</p>
      </div>
      <ReviewFindingsList v-if="findings.length" />
      <p
        v-if="inspection.partial"
        class="border-b border-warning/20 bg-warning/5 px-4 py-2 text-sm text-highlighted"
      >
        This preview is limited. Download the full workbook before confirming your review.
      </p>
      <ReviewWorkbookGrid v-if="sheet" />
      <p
        v-else
        class="px-4 py-5 text-sm text-muted"
      >
        No worksheet could be shown. Download the workbook to review it.
      </p>
    </div>
    <div
      v-else
      class="grid min-h-48 flex-1 place-items-center p-5 text-center text-sm text-muted"
      role="status"
    >
      {{ loading ? 'Reading draft workbook…' : error }}
    </div>
  </div>
</template>
