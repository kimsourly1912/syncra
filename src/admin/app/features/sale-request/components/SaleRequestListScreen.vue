<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge } from '#components'
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { SALE_REQUEST_PAGE_SIZES, useSaleRequestList } from '../composables/useSaleRequestList'
import type { SaleRequestStatusTab, SaleRequestTypeFilter } from '../composables/useSaleRequestList'
import type { SaleRequestRow } from '../models/sale-request'
import { formatSubmitDate, SALE_REQUEST_SOURCE, SALE_REQUEST_STATUS, SALE_REQUEST_TYPE } from '../utils/labels'

const {
  tab, type, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryError, refreshSummary, showStatus, showType, setSearch, showPage, setPageSize, clearFilters,
} = useSaleRequestList()

const typeItems: { label: string, value: SaleRequestTypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Module', value: 'module' },
  { label: 'Token', value: 'token' },
  { label: 'Seat', value: 'seat' },
]

// The API's totals become the tab counts. It has none for Completed, which shows no badge.
const tabs = computed<ListStatusTab<SaleRequestStatusTab>[]>(() => [
  { label: 'All', value: 'all', icon: 'lucide:inbox', count: summary.value?.total },
  { label: 'Pending', value: 'pending', icon: 'lucide:clock', count: summary.value?.pending },
  { label: 'Approved', value: 'approved', icon: 'lucide:circle-check', count: summary.value?.approved },
  { label: 'Rejected', value: 'rejected', icon: 'lucide:circle-x', count: summary.value?.rejected },
  { label: 'Completed', value: 'completed', icon: 'lucide:badge-check' },
])

// No sale request detail page exists yet, so rows don't open.
const columns: TableColumn<SaleRequestRow>[] = [
  { id: 'code', header: 'Request ID', cell: ({ row }) => row.original.requestCode ?? `#${row.original.id}` },
  {
    id: 'user',
    header: 'User name',
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.userName || '—'),
  },
  { id: 'email', header: 'Email address', cell: ({ row }) => row.original.emailAddress || '—' },
  { id: 'type', header: 'Type', cell: ({ row }) => (row.original.requestType ? SALE_REQUEST_TYPE[row.original.requestType] : '—') },
  { id: 'source', header: 'Source', cell: ({ row }) => (row.original.source ? SALE_REQUEST_SOURCE[row.original.source] : '—') },
  { id: 'submitted', header: 'Submitted', cell: ({ row }) => formatSubmitDate(row.original.submitDate) },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status ? SALE_REQUEST_STATUS[row.original.status] : undefined
      return status ? h(UBadge, { label: status.label, color: status.color, variant: 'subtle' }) : '—'
    },
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:shopping-cart"
        title="Sale Requests"
      />

      <UDashboardToolbar>
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search sale requests…"
            class="w-full max-w-sm"
            @update:model-value="setSearch"
          />
          <USelect
            :model-value="type"
            :items="typeItems"
            :disabled="pending"
            aria-label="Request type"
            class="w-40"
            @update:model-value="showType"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <AlertApiError
        v-if="summaryError"
        :error="summaryError"
        title="Could not load sale request totals"
        @retry="refreshSummary"
      />

      <div class="border-b border-default">
        <ListStatusTabs
          :model-value="tab"
          :items="tabs"
          :disabled="pending"
          aria-label="Request status"
          @update:model-value="showStatus"
        />
      </div>

      <AlertApiError
        v-if="error"
        :error="error"
        title="Could not load sale requests"
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
        >
          <template #loading>
            <ListSkeleton label="Loading sale requests…" />
          </template>
          <template #empty>
            <ListEmptyState
              noun="sale requests"
              :filtered="isFiltered"
              @clear="clearFilters"
            />
          </template>
        </UTable>
      </ListRefresh>

      <ListPagination
        :page="page"
        :page-count="totalPages"
        :page-sizes="SALE_REQUEST_PAGE_SIZES"
        :page-size="pageSize"
        :disabled="pending"
        @update:page="showPage"
        @update:page-size="setPageSize"
      />
    </template>
  </UDashboardPanel>
</template>
