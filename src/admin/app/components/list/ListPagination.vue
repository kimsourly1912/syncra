<script setup lang="ts">
/**
 * The pager under a paginated list: "Page n of N" (and rows per page, when the API takes a page
 * size) on the left, first, previous, page numbers, next, and last on the right. Nothing shows
 * while everything fits on one page of the smallest size. `pageCount` is the API's `totalPages`.
 *
 * @example
 * <ListPagination :page="list.page.value" :page-count="totalPages" :disabled="pending" @update:page="list.setPage" />
 * <ListPagination ... :page-sizes="[20, 50, 100]" :page-size="list.pageSize.value" @update:page-size="list.setPageSize" />
 */
const props = defineProps<{
  pageCount: number
  /** Rows-per-page choices. Leave out when the API has a fixed page size. */
  pageSizes?: readonly number[]
  pageSize?: number
  /** A load is running: the controls would change what's loading. */
  disabled?: boolean
}>()

// Declared, not `defineModel`: an optional model would type its update as `number | undefined`.
const emit = defineEmits<{ 'update:pageSize': [size: number] }>()

const page = defineModel<number>('page', { required: true })
const pageSize = computed({
  get: () => props.pageSize,
  set: (size) => {
    if (size !== undefined) emit('update:pageSize', size)
  },
})

const sizes = computed(() => (props.pageSizes ?? []).map(size => ({ label: String(size), value: size })))
const shown = computed(() => props.pageCount > 1 || (sizes.value.length > 0 && props.pageSize !== sizes.value[0]!.value))
</script>

<template>
  <nav
    v-if="shown"
    aria-label="Pagination"
    class="flex flex-wrap items-center justify-between gap-3"
  >
    <div class="flex items-center gap-4 text-sm text-muted">
      <span>Page {{ page }} of {{ Math.max(1, pageCount) }}</span>
      <div
        v-if="sizes.length"
        class="flex items-center gap-2"
      >
        <span>Rows per page</span>
        <USelect
          v-model="pageSize"
          :items="sizes"
          :disabled="disabled"
          aria-label="Rows per page"
          class="w-20"
        />
      </div>
    </div>

    <!-- One "item" per page: the API reports pages, not rows. -->
    <UPagination
      v-model:page="page"
      :total="Math.max(1, pageCount)"
      :items-per-page="1"
      :disabled="disabled"
      show-edges
      :sibling-count="1"
    />
  </nav>
</template>
