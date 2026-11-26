<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import type { WorkbookSheet } from '../models/workbook-inspection'
import { workbookCellKey } from '../utils/findings'
import type { WorkbookCell } from '../utils/findings'

const props = defineProps<{
  sheet: WorkbookSheet
  sheetIndex: number
  selection?: WorkbookCell
  flaggedCells: ReadonlySet<string>
  edits: ReadonlyMap<string, string>
}>()

const viewport = useTemplateRef<HTMLDivElement>('viewport')

// A size-grid sheet keeps its header row (Dim, Description, sizes) in view while the reviewer
// scrolls down, and its Dim column (A) while they scroll across, so each size value stays tied to
// its measurement. Only Dim is pinned, and only in a pane wide enough to spare it: pinning the
// description too left room for one size column. A Dim cell's tooltip gives the description.
const PINNED_COLUMN = 0
/** Narrower than this (40rem), the pinned column would crowd out the size columns. */
const MIN_PIN_WIDTH = 640
const { width: viewportWidth } = useElementSize(viewport)
const hasGridHeader = computed(() => props.sheet.gridHeaderRow != null
  && props.sheet.rows.some(row => row.number === props.sheet.gridHeaderRow))
const pinned = computed(() => hasGridHeader.value && viewportWidth.value >= MIN_PIN_WIDTH)
// The sticky offsets are fixed sizes in the stylesheet (--letters-height, --row-number-width),
// never measured: a measured offset that ran before fonts or layout settled left a strip where
// cells scrolling underneath showed through.
const isPinned = (columnIndex: number) => pinned.value && columnIndex === PINNED_COLUMN
/** The description (column B) as the pinned Dim cell's tooltip, since B scrolls away. */
const pinTitle = (columnIndex: number, cells: { value: string }[]) => (isPinned(columnIndex) && hasGridHeader.value
  ? cells[PINNED_COLUMN + 1]?.value || undefined
  : undefined)
const selectedCell = computed(() => props.selection ? workbookCellKey(props.selection) : undefined)

const rows = computed(() => props.sheet.rows.map(row => ({
  number: row.number,
  cells: props.sheet.columns.map((_, columnIndex) => {
    const key = workbookCellKey({ sheetIndex: props.sheetIndex, rowNumber: row.number, columnIndex })
    const editedValue = props.edits.get(key)
    const flagged = props.flaggedCells.has(key)
    return {
      key,
      flagged,
      edited: editedValue !== undefined,
      value: (editedValue ?? row.cells[columnIndex]) || (flagged ? 'Blank' : ''),
    }
  }),
})))

function scrollToSelection() {
  const view = viewport.value
  const target = selectedCell.value && view?.querySelector<HTMLElement>(`[data-cell="${selectedCell.value}"]`)
  if (!view || !target) return

  const cell = target.getBoundingClientRect()
  const bounds = view.getBoundingClientRect()
  view.scrollTo({
    left: view.scrollLeft + cell.left - bounds.left - (view.clientWidth - cell.width) / 2,
    top: view.scrollTop + cell.top - bounds.top - (view.clientHeight - cell.height) / 2,
  })
}

watch([() => props.sheet, () => props.selection], ([sheet], [previousSheet]) => {
  if (sheet !== previousSheet) viewport.value?.scrollTo(0, 0)
  scrollToSelection()
}, { flush: 'post' })
onMounted(scrollToSelection)
</script>

<template>
  <div
    ref="viewport"
    class="min-h-0 flex-1 overflow-auto bg-default outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
    tabindex="0"
    :aria-label="`${sheet.name} workbook preview`"
  >
    <table
      class="review-grid"
      :class="{ 'pin-header': hasGridHeader }"
    >
      <thead>
        <tr>
          <th scope="col">
            Row
          </th>
          <th
            v-for="(column, columnIndex) in sheet.columns"
            :key="column"
            scope="col"
            :class="{ 'pinned-cell': isPinned(columnIndex) }"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.number"
          :class="{ 'grid-header': row.number === sheet.gridHeaderRow }"
        >
          <th scope="row">
            {{ row.number }}
          </th>
          <td
            v-for="(cell, columnIndex) in row.cells"
            :key="cell.key"
            :data-cell="cell.key"
            :class="{
              'pinned-cell': isPinned(columnIndex),
              'flagged-cell': cell.flagged,
              'active-cell': cell.key === selectedCell,
              'edited-cell': cell.edited,
            }"
            :title="pinTitle(columnIndex, row.cells)"
          >
            {{ cell.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Fixed sizes the sticky offsets use. Nothing is measured, so they can't drift.
   Separate borders, not Tailwind's default `collapse`: with collapsed borders the table paints the
   sticky cells' borders and backgrounds, and cells scrolling underneath showed through the bottom
   of the column letters. Each cell draws only its right and bottom border, so none double up. */
.review-grid {
  --letters-height: 2.25rem;
  --row-number-width: 3.75rem;

  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

.review-grid :is(th, td) {
  box-sizing: border-box;
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

/* The column letters: one line at a fixed height, above everything that scrolls under them. */
.review-grid thead th {
  top: 0;
  z-index: 4;
  height: var(--letters-height);
  white-space: nowrap;
}

/* The row numbers: a fixed width, so the pinned Dim column starts exactly at its edge. */
.review-grid th:first-child {
  left: 0;
  z-index: 1;
  width: var(--row-number-width);
  min-width: var(--row-number-width);
  max-width: var(--row-number-width);
  text-align: end;
}

.review-grid thead th:first-child {
  z-index: 6;
}

/* The pinned Dim column: capped so the size columns keep the room. Its edge is its own border,
   drawn inside the cell, so nothing shows between it and the cells scrolling underneath. */
.review-grid td.pinned-cell {
  position: sticky;
  z-index: 1;
  max-width: 8rem;
}

.review-grid .pinned-cell {
  left: var(--row-number-width);
}

.review-grid .pinned-cell {
  border-right-color: var(--ui-border-accented);
}

/* Pinned cells need an opaque background. Same weight as the flagged and edited rules below,
   which come later and win. */
.review-grid .pinned-cell:where(td) {
  background: var(--ui-bg);
}

.review-grid thead th.pinned-cell {
  z-index: 5;
}

/* The size-grid header row sticks under the column letters. */
.review-grid.pin-header .grid-header :is(th, td) {
  position: sticky;
  top: var(--letters-height);
  z-index: 2;
}

.review-grid.pin-header .grid-header :is(th:first-child, .pinned-cell) {
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
}

.review-grid .active-cell {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

.review-grid .edited-cell {
  background: color-mix(in srgb, var(--ui-primary) 18%, var(--ui-bg));
}
</style>
