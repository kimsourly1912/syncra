<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { useReviewQueue } from '../composables/useReviewQueue'
import type { ReviewQueueTab } from '../composables/useReviewQueue'
import type { ReviewItem } from '../models/review-item'

const {
  tab, page, listQuery, items, totalPages, loading, refreshing, pending, error, refresh, showStatus, showPage,
} = useReviewQueue()

const tabs: ListStatusTab<ReviewQueueTab>[] = [
  { label: 'In Review', value: 'in-review' },
  { label: 'Reviewed', value: 'reviewed' },
]

const fileColumns: TableColumn<ReviewItem>[] = [
  { accessorKey: 'filename', header: 'TechPack file' },
  { accessorKey: 'companyId', header: 'Company ID' },
  { accessorKey: 'jobId', header: 'Job ID', meta: { class: { td: 'pr-9' } } },
]

const reviewedAtColumn: TableColumn<ReviewItem> = {
  accessorKey: 'reviewedAt',
  header: 'Reviewed at',
  meta: { class: { td: 'pr-9 whitespace-nowrap' } },
  cell: ({ row }) => row.original.reviewedAt ? new Date(row.original.reviewedAt).toLocaleString() : '—',
}

const columns = computed(() => tab.value === 'reviewed' ? [...fileColumns, reviewedAtColumn] : fileColumns)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:file-check"
        title="TechPack reviews"
      />
      <UDashboardToolbar>
        <template #left>
          <ListStatusTabs
            :model-value="tab"
            :items="tabs"
            :disabled="pending"
            aria-label="Review status"
            @update:model-value="showStatus"
          />
        </template>
        <template #right>
          <UButton
            label="Refresh"
            icon="lucide:refresh-cw"
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="refresh"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <AlertApiError
        v-if="error"
        :error="error"
        title="Could not load TechPack reviews"
        fallback="Could not load TechPack reviews."
        :retrying="pending"
        @retry="refresh"
      />

      <ListRefresh
        v-else
        :active="refreshing"
      >
        <UTable
          :data="items"
          :columns="columns"
          :loading="loading"
          :ui="{ root: 'rounded-lg border border-default', tr: 'relative' }"
          aria-label="TechPack reviews"
        >
          <template #filename-cell="{ row }">
            <div class="flex items-center gap-2">
              <UIcon
                name="lucide:file-text"
                class="size-4 shrink-0 text-muted"
              />
              <ULink
                v-if="row.original.draftUuid"
                :to="{ path: '/techpack-reviews/' + row.original.fileId, query: listQuery }"
                class="font-medium wrap-anywhere text-highlighted after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary"
              >
                {{ row.original.filename }}
                <UIcon
                  name="lucide:chevron-right"
                  class="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
              </ULink>
              <span
                v-else
                class="font-medium wrap-anywhere text-highlighted"
              >{{ row.original.filename }}</span>
            </div>
          </template>
          <template #loading>
            <ListSkeleton
              label="Loading reviews…"
              :rows="4"
            />
          </template>
          <template #empty>
            <ListEmptyState
              noun="TechPack reviews"
              :title="tab === 'in-review' ? 'No TechPacks are waiting for review.' : 'No reviewed TechPacks.'"
            />
          </template>
        </UTable>
      </ListRefresh>

      <ListPagination
        :page="page"
        :page-count="totalPages"
        :disabled="pending"
        @update:page="showPage"
      />
    </template>
  </UDashboardPanel>
</template>
