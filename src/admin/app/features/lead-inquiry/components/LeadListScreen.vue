<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, ULink } from '#components'
import type { CardStat } from '@/components/card/CardStats.vue'
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { LEAD_PAGE_SIZES, useLeadList } from '../composables/useLeadList'
import type { LeadStatusTab } from '../composables/useLeadList'
import type { LeadRow } from '../models/lead'
import { LEAD_STATUS } from '../utils/status'

const {
  tab, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryLoading, summaryError, refreshSummary, showStatus, setSearch, showPage, setPageSize, clearFilters,
} = useLeadList()

const tabs: ListStatusTab<LeadStatusTab>[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Converted', value: 'converted' },
  { label: 'Not interested', value: 'not-interested' },
]

const count = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString())

// The API's own totals, with its own names: they aren't mapped onto the status tabs.
const stats = computed<CardStat[]>(() => [
  { label: 'Leads received', icon: 'lucide:inbox', value: count(summary.value?.leadReceived), color: 'primary' },
  { label: 'Contacted', icon: 'lucide:phone', value: count(summary.value?.contacted), color: 'warning' },
  { label: 'Converted', icon: 'lucide:circle-check', value: count(summary.value?.converted), color: 'success' },
  { label: 'Rejected', icon: 'lucide:circle-x', value: count(summary.value?.rejected), color: 'error' },
])

const columns: TableColumn<LeadRow>[] = [
  {
    id: 'code',
    header: 'Lead ID',
    cell: ({ row }) => row.original.inquiryCode ?? `#${row.original.id}`,
  },
  {
    id: 'name',
    header: 'Name',
    // The name opens the lead.
    cell: ({ row }) => h(ULink, {
      to: `/lead-inquiry/${row.original.id}`,
      class: 'font-medium text-highlighted hover:text-primary',
    }, () => row.original.fullName || 'Unnamed lead'),
  },
  { id: 'company', header: 'Company', cell: ({ row }) => row.original.companyName || '—' },
  { id: 'email', header: 'Email address', cell: ({ row }) => row.original.workEmail || '—' },
  { id: 'phone', header: 'Phone number', cell: ({ row }) => row.original.phoneNumber || '—' },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status ? LEAD_STATUS[row.original.status] : undefined
      return status ? h(UBadge, { label: status.label, color: status.color, variant: 'soft' }) : '—'
    },
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Lead Inquiries" />

      <UDashboardToolbar>
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search leads…"
            class="w-full max-w-sm"
            @update:model-value="setSearch"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <AlertApiError
        v-if="summaryError"
        :error="summaryError"
        title="Could not load lead totals"
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
          aria-label="Lead status"
          @update:model-value="showStatus"
        />
      </div>

      <AlertApiError
        v-if="error"
        :error="error"
        title="Could not load leads"
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
          <template #empty>
            <ListEmptyState
              noun="leads"
              :filtered="isFiltered"
              @clear="clearFilters"
            />
          </template>
        </UTable>
      </ListRefresh>

      <ListPagination
        :page="page"
        :page-count="totalPages"
        :page-sizes="LEAD_PAGE_SIZES"
        :page-size="pageSize"
        :disabled="pending"
        @update:page="showPage"
        @update:page-size="setPageSize"
      />
    </template>
  </UDashboardPanel>
</template>
