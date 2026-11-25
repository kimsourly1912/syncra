<script setup lang="ts">
import type { BadgeProps, SelectItem, TableColumn } from '@nuxt/ui'
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

// The API can't filter by onboarding status yet (open question), so the filter is shown disabled.
const STATUS_FILTER_HINT = 'Filtering by onboarding status isn\'t available yet.'
const statusItems: SelectItem[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
]

const count = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString())

const stats = computed<CardStat[]>(() => [
  { label: 'Registered', icon: 'lucide:users', value: count(summary.value?.accountRegistered), color: 'primary' },
  { label: 'Completed', icon: 'lucide:circle-check', value: count(summary.value?.completedOnboardingVerification), color: 'success' },
  { label: 'Pending', icon: 'lucide:clock', value: count(summary.value?.pendingOnboardingVerification), color: 'warning' },
])

/** The account's name, or its email when it has none, so the email isn't shown twice. */
const title = (user: PortalUserRow) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email || `User #${user.userId}`
const showsEmail = (user: PortalUserRow) => !!user.email && title(user) !== user.email
const ids = (user: PortalUserRow) => [`User #${user.userId}`, user.companyId == null ? undefined : `Company #${user.companyId}`].filter(Boolean).join(' · ')
const onboarding = (user: PortalUserRow) => (user.onboardingStatus ? ONBOARDING[user.onboardingStatus] : undefined)
const seats = (user: PortalUserRow) => (user.seatTotal == null ? '—' : `${user.seatUsed ?? 0}/${user.seatTotal}`)
const cardStats = (user: PortalUserRow) => [
  { label: 'Modules', value: count(user.moduleActiveCount) },
  { label: 'Tokens', value: count(user.token) },
  { label: 'Seats', value: seats(user) },
]

// The name's link stretches over the row (or card), so the whole row opens the account.
const LINK = 'font-medium wrap-anywhere text-highlighted after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary'

const NUMBER = { th: 'text-right', td: 'text-right tabular-nums' }

const columns: TableColumn<PortalUserRow>[] = [
  { id: 'account', header: 'Account' },
  { id: 'onboarding', header: 'Onboarding' },
  { id: 'modules', header: 'Modules', meta: { class: NUMBER }, cell: ({ row }) => count(row.original.moduleActiveCount) },
  { id: 'token', header: 'Tokens', meta: { class: NUMBER }, cell: ({ row }) => count(row.original.token) },
  { id: 'seats', header: 'Seats', meta: { class: { th: 'text-right pr-12', td: 'text-right tabular-nums pr-12' } }, cell: ({ row }) => seats(row.original) },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:building-2"
        title="Account Management"
      >
        <!-- On a phone the actions move under the navbar, so the title keeps its room. -->
        <template #right>
          <div class="hidden items-center gap-2 sm:flex">
            <slot name="actions" />
          </div>
        </template>
      </UDashboardNavbar>

      <div class="grid grid-cols-2 gap-2 border-b border-default px-(--page-gutter) py-2 *:justify-center sm:hidden">
        <slot name="actions" />
      </div>

      <UDashboardToolbar>
        <!-- One row from `sm`; on a phone the search and the filter each take a full line. -->
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search accounts…"
            class="w-full sm:max-w-sm"
            @update:model-value="setSearch"
          />
          <!-- A disabled select gets no pointer events, so the hover hint sits on this wrapper. -->
          <div
            :title="STATUS_FILTER_HINT"
            class="w-full sm:w-44"
          >
            <USelect
              model-value="all"
              :items="statusItems"
              disabled
              aria-label="Onboarding status"
              aria-describedby="account-status-filter-hint"
              class="w-full"
            />
            <span
              id="account-status-filter-hint"
              class="sr-only"
            >{{ STATUS_FILTER_HINT }}</span>
          </div>
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
            class="h-7 w-12"
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
        <!-- Tablet and up: a table. -->
        <UTable
          :data="items"
          :columns="columns"
          :loading="loading"
          :ui="{ root: 'hidden md:block rounded-lg border border-default', tr: 'relative' }"
          aria-label="Accounts"
        >
          <template #account-cell="{ row }">
            <div class="min-w-0 space-y-0.5">
              <ULink
                :to="`/account/${row.original.userId}`"
                :class="LINK"
              >
                {{ title(row.original) }}
                <UIcon
                  name="lucide:chevron-right"
                  class="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
              </ULink>
              <p
                v-if="showsEmail(row.original)"
                class="text-muted wrap-anywhere"
              >
                {{ row.original.email }}
              </p>
              <p class="text-xs text-dimmed">
                {{ ids(row.original) }}
              </p>
            </div>
          </template>
          <template #onboarding-cell="{ row }">
            <UBadge
              v-if="onboarding(row.original)"
              :label="onboarding(row.original)!.label"
              :color="onboarding(row.original)!.color"
              variant="subtle"
            />
            <template v-else>
              —
            </template>
          </template>
          <template #loading>
            <ListSkeleton label="Loading accounts…" />
          </template>
          <template #empty>
            <ListEmptyState
              noun="accounts"
              :filtered="isFiltered"
              @clear="clearFilters"
            />
          </template>
        </UTable>

        <!-- Phone: one card per account. -->
        <div class="md:hidden">
          <ListSkeleton
            v-if="loading"
            label="Loading accounts…"
          />
          <ListEmptyState
            v-else-if="!items.length"
            noun="accounts"
            :filtered="isFiltered"
            @clear="clearFilters"
          />
          <ul
            v-else
            class="space-y-3"
            aria-label="Accounts"
          >
            <li
              v-for="user in items"
              :key="user.userId"
              class="relative rounded-lg border border-default bg-elevated/40 p-4"
            >
              <!-- The name gets the full width, so a long email doesn't break beside the badge. -->
              <div class="min-w-0 space-y-1 pe-6">
                <ULink
                  :to="`/account/${user.userId}`"
                  :class="[LINK, 'block after:rounded-lg']"
                >
                  {{ title(user) }}
                </ULink>
                <p
                  v-if="showsEmail(user)"
                  class="text-sm text-muted wrap-anywhere"
                >
                  {{ user.email }}
                </p>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <UBadge
                    v-if="onboarding(user)"
                    :label="onboarding(user)!.label"
                    :color="onboarding(user)!.color"
                    variant="subtle"
                    size="sm"
                  />
                  <span class="text-xs text-dimmed">{{ ids(user) }}</span>
                </div>
              </div>
              <UIcon
                name="lucide:chevron-right"
                class="absolute inset-e-3 top-4 size-4 text-muted"
                aria-hidden="true"
              />
              <!-- Three equal columns: a value can grow without wrapping the row. -->
              <dl class="mt-3 grid grid-cols-3 divide-x divide-default border-t border-default pt-3 text-center">
                <div
                  v-for="stat in cardStats(user)"
                  :key="stat.label"
                  class="min-w-0 px-1"
                >
                  <dt class="text-xs text-muted">
                    {{ stat.label }}
                  </dt>
                  <dd class="truncate font-medium text-highlighted tabular-nums">
                    {{ stat.value }}
                  </dd>
                </div>
              </dl>
            </li>
          </ul>
        </div>
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
