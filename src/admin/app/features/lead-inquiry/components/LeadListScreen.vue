<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, ULink } from '#components'
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { LEAD_PAGE_SIZES, useLeadList } from '../composables/useLeadList'
import type { LeadStatusTab } from '../composables/useLeadList'
import type { LeadRow } from '../models/lead'
import { LEAD_STATUS } from '../utils/status'

const {
  tab, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryError, refreshSummary, showStatus, setSearch, showPage, setPageSize, clearFilters,
} = useLeadList()

// The API's totals become the tab counts. It has none for New, and its "rejected" total isn't
// confirmed to be the Not interested status (open question), so those two show no badge.
const tabs = computed<ListStatusTab<LeadStatusTab>[]>(() => [
  { label: 'All', value: 'all', icon: 'lucide:inbox', count: summary.value?.leadReceived },
  { label: 'New', value: 'new', icon: 'lucide:sparkles' },
  { label: 'Contacted', value: 'contacted', icon: 'lucide:phone', count: summary.value?.contacted },
  { label: 'Converted', value: 'converted', icon: 'lucide:circle-check', count: summary.value?.converted },
  { label: 'Not interested', value: 'not-interested', icon: 'lucide:circle-x' },
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
      return status ? h(UBadge, { label: status.label, color: status.color, variant: 'subtle' }) : '—'
    },
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:inbox"
        title="Lead Inquiries"
      />

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
          <template #loading>
            <ListSkeleton label="Loading leads…" />
          </template>
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
