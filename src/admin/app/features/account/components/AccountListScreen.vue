<script setup lang="ts">
import type { BadgeProps, TableColumn } from '@nuxt/ui'
import { UBadge, ULink } from '#components'
import type { CardStat } from '@/components/card/CardStats.vue'
import { ACCOUNT_PAGE_SIZES, useAccountList } from '../composables/useAccountList'
import type { OnboardingStatus, PortalUserRow } from '../models/portal-user'

defineSlots<{
  /** Page actions in the navbar. */
  actions?(): unknown
}>()

const {
  search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryLoading, summaryError, refreshSummary, setSearch, showPage, setPageSize, clearFilters,
} = useAccountList()

const ONBOARDING: Record<OnboardingStatus, { label: string, color: BadgeProps['color'] }> = {
  COMPLETED: { label: 'Completed', color: 'success' },
  PENDING: { label: 'Pending', color: 'warning' },
}

const count = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString())

const stats = computed<CardStat[]>(() => [
  { label: 'Accounts registered', icon: 'lucide:building-2', value: count(summary.value?.accountRegistered), color: 'primary' },
  { label: 'Completed onboarding verification', icon: 'lucide:circle-check', value: count(summary.value?.completedOnboardingVerification), color: 'success' },
  { label: 'Pending onboarding verification', icon: 'lucide:clock', value: count(summary.value?.pendingOnboardingVerification), color: 'warning' },
])

const fullName = (user: PortalUserRow) => [user.firstname, user.lastname].filter(Boolean).join(' ')

const columns: TableColumn<PortalUserRow>[] = [
  { id: 'userId', header: 'User ID', cell: ({ row }) => `#${row.original.userId}` },
  {
    id: 'name',
    header: 'User name',
    // The name opens the account.
    cell: ({ row }) => h(ULink, {
      to: `/account/${row.original.userId}`,
      class: 'font-medium text-highlighted hover:text-primary',
    }, () => fullName(row.original) || row.original.email || `User #${row.original.userId}`),
  },
  { id: 'email', header: 'Email address', cell: ({ row }) => row.original.email || '—' },
  { id: 'companyId', header: 'Company ID', cell: ({ row }) => (row.original.companyId == null ? '—' : `#${row.original.companyId}`) },
  {
    id: 'onboarding',
    header: 'Onboarding status',
    cell: ({ row }) => {
      const status = row.original.onboardingStatus ? ONBOARDING[row.original.onboardingStatus] : undefined
      return status ? h(UBadge, { label: status.label, color: status.color, variant: 'soft' }) : '—'
    },
  },
  { id: 'modules', header: 'Modules active', cell: ({ row }) => count(row.original.moduleActiveCount) },
  { id: 'token', header: 'Tokens', cell: ({ row }) => count(row.original.token) },
  {
    id: 'seats',
    header: 'Seats',
    cell: ({ row }) => (row.original.seatTotal == null ? '—' : `${row.original.seatUsed ?? 0}/${row.original.seatTotal}`),
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Account Management">
        <template #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search accounts…"
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
        title="Could not load account totals"
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

      <AlertApiError
        v-if="error"
        :error="error"
        title="Could not load accounts"
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
              noun="accounts"
              :filtered="isFiltered"
              @clear="clearFilters"
            />
          </template>
        </UTable>
      </ListRefresh>

      <ListPagination
        :page="page"
        :page-count="totalPages"
        :page-sizes="ACCOUNT_PAGE_SIZES"
        :page-size="pageSize"
        :disabled="pending"
        @update:page="showPage"
        @update:page-size="setPageSize"
      />
    </template>
  </UDashboardPanel>
</template>
