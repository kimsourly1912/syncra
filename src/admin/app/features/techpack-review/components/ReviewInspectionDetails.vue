<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { inspection: draft } = useReviewDetail()
const { inspection, aiFindings } = draft
const sourceCheck = computed(() => inspection.value?.sourceCheck)
const aiReview = computed(() => inspection.value?.aiReview)
</script>

<template>
  <UPopover
    v-if="inspection"
    :content="{ align: 'end' }"
  >
    <UButton
      label="Review details"
      color="neutral"
      variant="ghost"
      size="sm"
      class="shrink-0"
    />

    <template #content>
      <div class="max-h-72 w-72 max-w-[calc(100vw-1rem)] space-y-3 overflow-y-auto p-3 text-sm text-muted">
        <div class="space-y-1">
          <h3 class="font-semibold text-highlighted">
            PDF comparison
          </h3>
          <p v-if="sourceCheck?.comparedCells">
            Compared {{ sourceCheck.comparedCells }} size and tolerance cells with the PDF.
          </p>
          <p v-else-if="!sourceCheck">
            Source comparison unavailable. Verify the workbook against the PDF.
          </p>
          <p v-else-if="sourceCheck.verified">
            No differences found in the cells compared.
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
          class="space-y-1 border-t border-default pt-2"
        >
          <h3 class="font-semibold text-highlighted">
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
  </UPopover>
</template>
