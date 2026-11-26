<script setup lang="ts" generic="T extends TableData">
import type { TableColumn, TableData, TableSlots } from '@nuxt/ui'

/**
 * The body of an API-backed list: its error with Retry, then a table from `md` up and one card
 * per row on a phone, both with the loading and empty states, dimmed while refreshing, then the
 * pager. The screen keeps its header (title, tabs, search, filters) and passes what each row
 * shows: `#<column>-cell` slots for the table (as on `UTable`), and `#card` for the phone card.
 *
 * @example
 * <ListResults :items :columns :row-key="row => row.id" noun="leads" label="Leads" … @retry="refresh">
 *   <template #lead-cell="{ row }">…</template>
 *   <template #card="{ row }">…</template>
 * </ListResults>
 */
const props = defineProps<{
  items: T[]
  columns: TableColumn<T>[]
  /** A stable id for a row's card. */
  rowKey: (row: T) => PropertyKey
  /** Plural, lower case: "leads". Used in "Loading leads…" and the empty state. */
  noun: string
  /** The list's accessible name: "Leads". */
  label: string
  /** The list request's failure, shown with Retry instead of the rows. */
  error?: unknown
  errorTitle: string
  loading: boolean
  refreshing: boolean
  /** Any load in flight: Retry spins and the pager is disabled. */
  pending: boolean
  /** A filter or search is applied, so the empty state offers Clear filters. */
  filtered: boolean
  page: number
  pageCount: number
  pageSizes?: readonly number[]
  pageSize?: number
  /** Extra classes for a phone card, e.g. `space-y-2 pe-9` to make room for a chevron. */
  cardClass?: string
}>()

const emit = defineEmits<{
  'retry': []
  'clear': []
  'update:page': [page: number]
  'update:pageSize': [size: number]
}>()

type CellSlot = TableSlots<T>[`${string}-cell`]

const slots = defineSlots<{
  card: (props: { row: T }) => unknown
} & Record<`${string}-cell`, CellSlot>>()

/** The `#<column>-cell` slots the screen passed, forwarded to the table. */
const cellSlots = computed(() => props.columns
  .map(column => `${column.id}-cell` as const)
  .filter(name => !!slots[name]))
</script>

<template>
  <AlertApiError
    v-if="error"
    :error="error"
    :title="errorTitle"
    :retrying="pending"
    @retry="emit('retry')"
  />
  <ListRefresh
    v-else
    :active="refreshing"
  >
    <!-- Tablet and up: a table. -->
    <UTable
      :data="items"
      :columns="columns"
      :loading="loading"
      :ui="{ root: 'hidden md:block rounded-lg border border-default', tr: 'relative' }"
      :aria-label="label"
    >
      <template
        v-for="name in cellSlots"
        #[name]="cell"
        :key="name"
      >
        <slot
          :name="name"
          v-bind="cell"
        />
      </template>
      <template #loading>
        <ListSkeleton :label="`Loading ${noun}…`" />
      </template>
      <template #empty>
        <ListEmptyState
          :noun="noun"
          :filtered="filtered"
          @clear="emit('clear')"
        />
      </template>
    </UTable>

    <!-- Phone: one card per row. -->
    <div class="md:hidden">
      <ListSkeleton
        v-if="loading"
        :label="`Loading ${noun}…`"
      />
      <ListEmptyState
        v-else-if="!items.length"
        :noun="noun"
        :filtered="filtered"
        @clear="emit('clear')"
      />
      <ul
        v-else
        class="space-y-3"
        :aria-label="label"
      >
        <li
          v-for="row in items"
          :key="rowKey(row)"
          class="relative rounded-lg border border-default bg-elevated/40 p-4"
          :class="cardClass"
        >
          <slot
            name="card"
            :row="row"
          />
        </li>
      </ul>
    </div>
  </ListRefresh>

  <ListPagination
    :page="page"
    :page-count="pageCount"
    :page-sizes="pageSizes"
    :page-size="pageSize"
    :disabled="pending"
    @update:page="emit('update:page', $event)"
    @update:page-size="emit('update:pageSize', $event)"
  />
</template>
