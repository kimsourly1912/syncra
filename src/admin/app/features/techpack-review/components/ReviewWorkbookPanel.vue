<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useReviewDetail } from '../composables/useReviewDetail'
import ReviewInspectionDetails from './ReviewInspectionDetails.vue'
import ReviewIssueEditor from './ReviewIssueEditor.vue'
import ReviewIssuesMenu from './ReviewIssuesMenu.vue'
import ReviewWorkbookGrid from './ReviewWorkbookGrid.vue'
import ReviewWorkbookReplacement from './ReviewWorkbookReplacement.vue'

const { inspection: draft, workbook, actions } = useReviewDetail()
const { inspection, pending, error } = draft
const { sheets, sheet, sheetIndex, selection, flaggedCells, edits } = workbook
const { busy } = actions

const replacementOpen = ref(false)
const workbookMenu = computed<DropdownMenuItem[]>(() => [{
  label: 'Replace workbook',
  icon: 'lucide:upload',
  disabled: busy.value || !!workbook.staged.value.length,
  onSelect: () => { replacementOpen.value = true },
}])

const hasCheckedSheet = computed(() => sheets.value.some(sheet => sheet.gridHeaderRow != null))
</script>

<template>
  <section
    aria-label="Draft workbook"
    class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-default"
  >
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-2">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="lucide:sheet"
          class="size-4 text-primary"
        />
        Draft workbook
      </h2>
      <div class="flex flex-wrap items-center gap-1">
        <ReviewIssuesMenu />
        <div class="ms-auto flex shrink-0 items-center gap-1">
          <UButton
            label="Download workbook"
            icon="lucide:download"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="busy"
            @click="actions.download('draft')"
          />
          <UDropdownMenu :items="workbookMenu">
            <UButton
              aria-label="Workbook actions"
              icon="lucide:ellipsis"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="busy"
            />
          </UDropdownMenu>
        </div>
      </div>
    </header>

    <div
      v-if="inspection?.partial"
      role="status"
      class="border-b border-default bg-warning/5 px-3 py-2 text-sm text-highlighted"
    >
      This preview is limited. Download the full workbook before confirming your review.
    </div>

    <div
      v-if="error"
      class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-2 text-sm text-muted"
    >
      <p role="status">
        Workbook preview unavailable. Download the workbook to review it.
      </p>
      <UButton
        label="Retry workbook preview"
        color="neutral"
        variant="outline"
        size="sm"
        :loading="pending"
        @click="draft.refresh"
      />
    </div>

    <ReviewIssueEditor
      v-if="selection"
      :finding="selection"
    />

    <div
      v-if="sheet"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex items-center justify-between gap-2 border-b border-default px-2 py-1">
        <div
          class="flex min-w-0 items-center gap-1 overflow-x-auto"
          aria-label="Workbook sheets"
          role="group"
        >
          <UButton
            v-for="(tab, index) in sheets"
            :key="tab.name"
            :label="tab.name"
            :variant="sheetIndex === index ? 'soft' : 'ghost'"
            :color="sheetIndex === index ? 'primary' : 'neutral'"
            :aria-pressed="sheetIndex === index"
            size="sm"
            class="shrink-0"
            @click="workbook.selectSheet(index)"
          />
          <span
            v-if="hasCheckedSheet && sheet.gridHeaderRow == null"
            class="shrink-0 px-2 text-xs text-muted"
          >
            No size grid checks on this sheet
          </span>
        </div>
        <ReviewInspectionDetails />
      </div>
      <ReviewWorkbookGrid
        :sheet="sheet"
        :sheet-index="sheetIndex"
        :selection="selection"
        :flagged-cells="flaggedCells"
        :edits="edits"
      />
    </div>
    <div
      v-else
      class="min-h-72 flex-1 p-4 text-sm text-muted lg:@min-[46rem]:min-h-0"
      role="status"
    >
      <p v-if="pending">
        Reading draft workbook…
      </p>
      <p v-else-if="!error">
        No worksheet could be shown. Download the workbook to review it.
      </p>
    </div>

    <ReviewInspectionDetails
      v-if="inspection && !sheet"
      class="m-2 self-start"
    />
    <ReviewWorkbookReplacement v-model:open="replacementOpen" />
  </section>
</template>
