<script setup lang="ts">
import type { TableColumn, TabsItem } from '@nuxt/ui'
import { SALE_REQUEST_PAGE_SIZES, useSaleRequestList } from '../composables/useSaleRequestList'
import type { SaleRequestStatusTab, SaleRequestTypeFilter } from '../composables/useSaleRequestList'
import type { SaleRequestRow } from '../models/sale-request'
import { SALE_REQUEST_SOURCE, SALE_REQUEST_STATUS, SALE_REQUEST_TYPE, submitDate } from '../utils/labels'
import SaleRequestDetailSlideover from './SaleRequestDetailSlideover.vue'

const {
  tab, type, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryError, refreshSummary, showStatus, showType, setSearch, showPage, setPageSize, clearFilters,
  openId, openRequest, closeRequest,
} = useSaleRequestList()

const typeItems: { label: string, value: SaleRequestTypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Module', value: 'module' },
  { label: 'Token', value: 'token' },
  { label: 'Seat', value: 'seat' },
]

const count = (value: number | null | undefined) => (value == null
  ? undefined
  : { label: value.toLocaleString(), color: 'neutral' as const, variant: 'subtle' as const, size: 'sm' as const })

// In the toolbar, so the tabs sit on its line. The API's totals become the tab counts; it has
// none for Completed, which shows no badge.
type StatusTab = TabsItem & { value: SaleRequestStatusTab }
const tabs = computed(() => ([
  { label: 'All', value: 'all', icon: 'lucide:inbox', badge: count(summary.value?.total) },
  { label: 'Pending', value: 'pending', icon: 'lucide:clock', badge: count(summary.value?.pending) },
  { label: 'Approved', value: 'approved', icon: 'lucide:circle-check', badge: count(summary.value?.approved) },
  { label: 'Rejected', value: 'rejected', icon: 'lucide:circle-x', badge: count(summary.value?.rejected) },
  { label: 'Completed', value: 'completed', icon: 'lucide:badge-check' },
] satisfies StatusTab[]).map((item): StatusTab => ({ ...item, disabled: pending.value })))

const code = (row: SaleRequestRow) => row.requestCode ?? `#${row.id}`
/** The requester's name, or the email when there's none, so the email isn't shown twice. */
const requester = (row: SaleRequestRow) => row.userName || row.emailAddress || '—'
const showsEmail = (row: SaleRequestRow) => !!row.emailAddress && requester(row) !== row.emailAddress
const status = (row: SaleRequestRow) => (row.status ? SALE_REQUEST_STATUS[row.status] : undefined)
const requestType = (row: SaleRequestRow) => (row.requestType ? SALE_REQUEST_TYPE[row.requestType] : undefined)
const meta = (row: SaleRequestRow) => [submitDate(row.submitDate).age, row.source ? SALE_REQUEST_SOURCE[row.source] : undefined]
  .filter(Boolean).join(' · ')

const openRow = computed(() => items.value.find(row => row.id === openId.value))

// The code's button stretches over the row (or card), so the whole row opens the request.
const OPEN = 'text-start font-medium wrap-anywhere text-highlighted after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary'

const columns: TableColumn<SaleRequestRow>[] = [
  { id: 'request', header: 'Request' },
  { id: 'requester', header: 'Requested by' },
  { id: 'type', header: 'Type' },
  { id: 'status', header: 'Status', meta: { class: { th: 'pr-12', td: 'pr-12' } } },
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
          <ListToolbarTabs
            :model-value="tab"
            :items="tabs"
            role="group"
            aria-label="Request status"
            @update:model-value="showStatus"
          />
        </template>
      </UDashboardToolbar>

      <UDashboardToolbar>
        <!-- One row from `sm`; on a phone the search and the filter each take a full line. -->
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search sale requests…"
            class="w-full sm:max-w-sm"
            @update:model-value="setSearch"
          />
          <USelect
            :model-value="type"
            :items="typeItems"
            :disabled="pending"
            aria-label="Request type"
            class="w-full sm:w-40"
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
        <!-- Tablet and up: a table. -->
        <UTable
          :data="items"
          :columns="columns"
          :loading="loading"
          :ui="{ root: 'hidden md:block rounded-lg border border-default', tr: 'relative' }"
          aria-label="Sale requests"
        >
          <template #request-cell="{ row }">
            <div class="min-w-0 space-y-0.5">
              <button
                type="button"
                :class="OPEN"
                @click="openRequest(row.original.id)"
              >
                {{ code(row.original) }}
                <UIcon
                  name="lucide:chevron-right"
                  class="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
              </button>
              <p
                class="text-xs text-dimmed"
                :title="submitDate(row.original.submitDate).full"
              >
                {{ meta(row.original) }}
              </p>
            </div>
          </template>
          <template #requester-cell="{ row }">
            <div class="min-w-0 space-y-0.5">
              <p class="wrap-anywhere text-highlighted">
                {{ requester(row.original) }}
              </p>
              <p
                v-if="showsEmail(row.original)"
                class="wrap-anywhere text-muted"
              >
                {{ row.original.emailAddress }}
              </p>
            </div>
          </template>
          <template #type-cell="{ row }">
            <span
              v-if="requestType(row.original)"
              class="inline-flex items-center gap-1.5"
            >
              <UIcon
                :name="requestType(row.original)!.icon"
                class="size-4 text-muted"
                aria-hidden="true"
              />
              {{ requestType(row.original)!.label }}
            </span>
            <template v-else>
              —
            </template>
          </template>
          <template #status-cell="{ row }">
            <UBadge
              v-if="status(row.original)"
              :label="status(row.original)!.label"
              :color="status(row.original)!.color"
              variant="subtle"
            />
            <template v-else>
              —
            </template>
          </template>
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

        <!-- Phone: one card per request. -->
        <div class="md:hidden">
          <ListSkeleton
            v-if="loading"
            label="Loading sale requests…"
          />
          <ListEmptyState
            v-else-if="!items.length"
            noun="sale requests"
            :filtered="isFiltered"
            @clear="clearFilters"
          />
          <ul
            v-else
            class="space-y-3"
            aria-label="Sale requests"
          >
            <li
              v-for="row in items"
              :key="row.id"
              class="relative space-y-2 rounded-lg border border-default bg-elevated/40 p-4 pe-9"
            >
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  :class="[OPEN, 'after:rounded-lg']"
                  @click="openRequest(row.id)"
                >
                  {{ code(row) }}
                </button>
                <UBadge
                  v-if="status(row)"
                  :label="status(row)!.label"
                  :color="status(row)!.color"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <div class="min-w-0 text-sm">
                <p class="wrap-anywhere text-highlighted">
                  {{ requester(row) }}
                </p>
                <p
                  v-if="showsEmail(row)"
                  class="wrap-anywhere text-muted"
                >
                  {{ row.emailAddress }}
                </p>
              </div>
              <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dimmed">
                <span
                  v-if="requestType(row)"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    :name="requestType(row)!.icon"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                  {{ requestType(row)!.label }}
                </span>
                <span :title="submitDate(row.submitDate).full">{{ meta(row) }}</span>
              </p>
              <UIcon
                name="lucide:chevron-right"
                class="absolute inset-e-3 top-4 size-4 text-muted"
                aria-hidden="true"
              />
            </li>
          </ul>
        </div>
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

      <SaleRequestDetailSlideover
        :id="openId"
        :row="openRow"
        @close="closeRequest"
      />
    </template>
  </UDashboardPanel>
</template>
