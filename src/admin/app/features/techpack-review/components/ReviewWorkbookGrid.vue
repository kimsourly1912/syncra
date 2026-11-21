<script setup lang="ts">
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
    class="h-96 min-h-0 flex-1 overflow-auto bg-default @min-[72rem]:h-auto"
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
          v-for="row in rows"
          :key="row.number"
          :class="{ 'grid-header': row.number === sheet.gridHeaderRow }"
        >
          <th scope="row">
            {{ row.number }}
          </th>
          <td
            v-for="cell in row.cells"
            :key="cell.key"
            :data-cell="cell.key"
            :class="{
              'flagged-cell': cell.flagged,
              'active-cell': cell.key === selectedCell,
              'edited-cell': cell.edited,
            }"
          >
            {{ cell.value }}
          </td>
        </tr>
      </tbody>
    </table>
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
}

.review-grid .active-cell {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

.review-grid .edited-cell {
  background: color-mix(in srgb, var(--ui-primary) 18%, var(--ui-bg));
}
</style>
