<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge } from '#components'
import type { CardStat } from '@/components/card/CardStats.vue'
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { SALE_REQUEST_PAGE_SIZES, useSaleRequestList } from '../composables/useSaleRequestList'
import type { SaleRequestStatusTab, SaleRequestTypeFilter } from '../composables/useSaleRequestList'
import type { SaleRequestRow } from '../models/sale-request'
import { formatSubmitDate, SALE_REQUEST_SOURCE, SALE_REQUEST_STATUS, SALE_REQUEST_TYPE } from '../utils/labels'

const {
  tab, type, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryLoading, summaryError, refreshSummary, showStatus, showType, setSearch, showPage, setPageSize, clearFilters,
} = useSaleRequestList()

const tabs: ListStatusTab<SaleRequestStatusTab>[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
]

const typeItems: { label: string, value: SaleRequestTypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Module', value: 'module' },
  { label: 'Token', value: 'token' },
  { label: 'Seat', value: 'seat' },
]

const count = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString())

// The API's own totals, with its own names: they aren't mapped onto the status tabs.
const stats = computed<CardStat[]>(() => [
  { label: 'Total requests', icon: 'lucide:inbox', value: count(summary.value?.total), color: 'primary' },
  { label: 'Pending', icon: 'lucide:clock', value: count(summary.value?.pending), color: 'warning' },
  { label: 'Approved', icon: 'lucide:circle-check', value: count(summary.value?.approved), color: 'info' },
  { label: 'Rejected', icon: 'lucide:circle-x', value: count(summary.value?.rejected), color: 'error' },
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
      return status ? h(UBadge, { label: status.label, color: status.color, variant: 'soft' }) : '—'
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
      <CardStats
        v-else
        :items="stats"
      >
        <template #value="{ item }">
          <USkeleton
            v-if="summaryLoading"
            class="h-8 w-16"
          />
          <template v-else>
            {{ item.value }}
          </template>
        </template>
      </CardStats>

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
