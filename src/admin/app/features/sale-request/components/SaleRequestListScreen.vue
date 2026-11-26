<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ToolbarTab } from '@/components/list/ListToolbarTabs.vue'
import { useSaleRequestList } from '../composables/useSaleRequestList'
import type { SaleRequestStatusTab, SaleRequestTypeFilter } from '../composables/useSaleRequestList'
import type { SaleRequestRow } from '../models/sale-request'
import { SALE_REQUEST_SOURCE, SALE_REQUEST_STATUS, SALE_REQUEST_TYPE } from '../utils/labels'
import SaleRequestDetailSlideover from './SaleRequestDetailSlideover.vue'

const {
  tab, type, search, page, pageSize, pageSizes, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryError, refreshSummary, showStatus, showType, setSearch, showPage, setPageSize, clearFilters,
  openId, openRequest, closeRequest,
} = useSaleRequestList()

const typeItems: { label: string, value: SaleRequestTypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Module', value: 'module' },
  { label: 'Token', value: 'token' },
  { label: 'Seat', value: 'seat' },
]

// In the toolbar, so the tabs sit on its line. The API's totals become the tab counts; it has
// none for Completed, which shows no badge.
type StatusTab = ToolbarTab<SaleRequestStatusTab>
const tabs = computed(() => ([
  { label: 'All', value: 'all', icon: 'lucide:inbox', count: summary.value?.total },
  { label: 'Pending', value: 'pending', icon: 'lucide:clock', count: summary.value?.pending },
  { label: 'Approved', value: 'approved', icon: 'lucide:circle-check', count: summary.value?.approved },
  { label: 'Rejected', value: 'rejected', icon: 'lucide:circle-x', count: summary.value?.rejected },
  { label: 'Completed', value: 'completed', icon: 'lucide:badge-check' },
] satisfies StatusTab[]).map((item): StatusTab => ({ ...item, disabled: pending.value })))

const code = (row: SaleRequestRow) => row.requestCode ?? `#${row.id}`
/** The requester's name, or the email when there's none, so the email isn't shown twice. */
const requester = (row: SaleRequestRow) => row.userName || row.emailAddress || NO_VALUE
const showsEmail = (row: SaleRequestRow) => !!row.emailAddress && requester(row) !== row.emailAddress
const status = (row: SaleRequestRow) => (row.status ? SALE_REQUEST_STATUS[row.status] : undefined)
const requestType = (row: SaleRequestRow) => (row.requestType ? SALE_REQUEST_TYPE[row.requestType] : undefined)
const meta = (row: SaleRequestRow) => [formatAge(row.submitDate).age, row.source ? SALE_REQUEST_SOURCE[row.source] : undefined]
  .filter(Boolean).join(' · ')

const openRow = computed(() => items.value.find(row => row.id === openId.value))

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
        title="Sale requests"
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

      <ListResults
        :items="items"
        :columns="columns"
        :row-key="row => row.id"
        noun="sale requests"
        label="Sale requests"
        :error="error"
        error-title="Could not load sale requests"
        :loading="loading"
        :refreshing="refreshing"
        :pending="pending"
        :filtered="isFiltered"
        :page="page"
        :page-count="totalPages"
        :page-sizes="pageSizes"
        :page-size="pageSize"
        card-class="space-y-2 pe-9"
        @retry="refresh"
        @clear="clearFilters"
        @update:page="showPage"
        @update:page-size="setPageSize"
      >
        <template #request-cell="{ row }">
          <div class="min-w-0 space-y-0.5">
            <button
              type="button"
              class="row-link"
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
              class="text-xs text-muted"
              :title="formatAge(row.original.submitDate).full"
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
        <template #card="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="row-link after:rounded-lg"
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
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
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
            <span :title="formatAge(row.submitDate).full">{{ meta(row) }}</span>
          </p>
          <UIcon
            name="lucide:chevron-right"
            class="absolute inset-e-3 top-4 size-4 text-muted"
            aria-hidden="true"
          />
        </template>
      </ListResults>

      <SaleRequestDetailSlideover
        :id="openId"
        :row="openRow"
        @close="closeRequest"
      />
    </template>
  </UDashboardPanel>
</template>
