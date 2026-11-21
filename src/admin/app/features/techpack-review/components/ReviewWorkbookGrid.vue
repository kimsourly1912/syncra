<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { cellKey, editKey } from '../utils/findings'

const { inspection: draft } = useReviewDetail()
const { inspection, sheet, sheetIndex, activeCell, edits, flaggedCells, checkedGrid, gridViewport, selectSheet, displayCell } = draft
</script>

<template>
  <div
    v-if="inspection && sheet"
    class="flex flex-1 flex-col"
  >
    <div
      class="flex items-center gap-2 overflow-x-auto border-b border-default bg-default px-4 py-2"
      aria-label="Workbook sheets"
    >
      <UButton
        v-for="(tab, index) in inspection.sheets"
        :key="tab.name"
        :label="tab.name"
        :variant="sheetIndex === index ? 'soft' : 'ghost'"
        :color="sheetIndex === index ? 'primary' : 'neutral'"
        :aria-pressed="sheetIndex === index"
        size="sm"
        class="shrink-0"
        @click="selectSheet(index)"
      />
      <span
        v-if="checkedGrid && sheet.gridHeaderRow === null"
        class="shrink-0 text-xs text-muted"
      >No size grid checks on this sheet</span>
    </div>
    <div
      ref="gridViewport"
      class="max-h-[48dvh] min-h-52 flex-1 overflow-auto bg-default"
      tabindex="0"
      :aria-label="`${sheet.name} workbook preview`"
    >
      <table class="review-grid">
        <thead>
          <tr>
            <th scope="col">
              Row
            </th>
            <th
              v-for="column in sheet.columns"
              :key="column"
              scope="col"
            >
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sheet.rows"
            :key="row.number"
            :class="{ 'grid-header': row.number === sheet.gridHeaderRow }"
          >
            <th scope="row">
              {{ row.number }}
            </th>
            <td
              v-for="(column, index) in sheet.columns"
              :key="column"
              :data-cell="cellKey(row.number, index)"
              :tabindex="flaggedCells.has(cellKey(row.number, index)) ? -1 : undefined"
              :class="{
                'flagged-cell': flaggedCells.has(cellKey(row.number, index)),
                'active-cell': activeCell === cellKey(row.number, index),
                'edited-cell': edits.has(editKey({ sheetIndex, rowNumber: row.number, columnIndex: index })),
              }"
            >
              {{ displayCell(row, index) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.review-grid {
  width: max-content;
  min-width: 100%;
  border-spacing: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

.review-grid :is(th, td) {
  padding: 0.375rem 0.625rem;
  border-right: 1px solid var(--ui-border);
  border-bottom: 1px solid var(--ui-border);
  text-align: start;
}

.review-grid th {
  position: sticky;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  font-weight: 500;
}

.review-grid thead th {
  top: 0;
  z-index: 2;
}

.review-grid th:first-child {
  left: 0;
  z-index: 1;
  text-align: end;
}

.review-grid thead th:first-child {
  z-index: 3;
}

.review-grid td {
  min-width: 3.5rem;
  max-width: 24rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.review-grid .grid-header td {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.review-grid .flagged-cell {
  background: color-mix(in srgb, var(--ui-warning) 18%, var(--ui-bg));
  font-weight: 600;
  scroll-margin-block-start: 2rem;
  scroll-margin-inline-start: 3rem;
}

.review-grid .active-cell {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

.review-grid .edited-cell {
  background: color-mix(in srgb, var(--ui-primary) 18%, var(--ui-bg));
}
</style>
