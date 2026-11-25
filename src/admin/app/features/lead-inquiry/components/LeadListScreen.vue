<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ToolbarTab } from '@/components/list/ListToolbarTabs.vue'
import { LEAD_PAGE_SIZES, useLeadList } from '../composables/useLeadList'
import type { LeadStatusTab } from '../composables/useLeadList'
import type { LeadRow } from '../models/lead'
import { LEAD_STATUS } from '../utils/status'
import LeadDetailSlideover from './LeadDetailSlideover.vue'

const {
  tab, search, page, pageSize, isFiltered, items, totalPages, loading, refreshing, pending, error, refresh,
  summary, summaryError, refreshSummary, showStatus, setSearch, showPage, setPageSize, clearFilters,
  openId, openLead, closeLead,
} = useLeadList()

// In the toolbar, so the tabs sit on its line. The API's totals become the tab counts. It has none
// for New, and its "rejected" total isn't confirmed to be the Not interested status (open
// question), so those two show no badge.
type StatusTab = ToolbarTab<LeadStatusTab>
const tabs = computed(() => ([
  { label: 'All', value: 'all', icon: 'lucide:inbox', count: summary.value?.leadReceived },
  { label: 'New', value: 'new', icon: 'lucide:sparkles' },
  { label: 'Contacted', value: 'contacted', icon: 'lucide:phone', count: summary.value?.contacted },
  { label: 'Converted', value: 'converted', icon: 'lucide:circle-check', count: summary.value?.converted },
  { label: 'Not interested', value: 'not-interested', icon: 'lucide:circle-x' },
] satisfies StatusTab[]).map((item): StatusTab => ({ ...item, disabled: pending.value })))

const name = (row: LeadRow) => row.fullName || 'Unnamed lead'
const ids = (row: LeadRow) => [row.inquiryCode ?? `#${row.id}`, row.companyName].filter(Boolean).join(' · ')
const status = (row: LeadRow) => (row.status ? LEAD_STATUS[row.status] : undefined)
/** The first two products picked, and how many more, so a long pick doesn't widen the row. */
const interests = (row: LeadRow) => {
  const all = row.interestedProduct?.filter(Boolean) ?? []
  return { shown: all.slice(0, 2), more: Math.max(0, all.length - 2) }
}

const openRow = computed(() => items.value.find(row => row.id === openId.value))

const columns: TableColumn<LeadRow>[] = [
  { id: 'lead', header: 'Lead' },
  { id: 'contact', header: 'Contact' },
  { id: 'interest', header: 'Interested in' },
  { id: 'status', header: 'Status', meta: { class: { th: 'pr-12', td: 'pr-12' } } },
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
          <ListToolbarTabs
            :model-value="tab"
            :items="tabs"
            role="group"
            aria-label="Lead status"
            @update:model-value="showStatus"
          />
        </template>
      </UDashboardToolbar>

      <UDashboardToolbar>
        <template #left>
          <InputSearch
            :model-value="search"
            placeholder="Search leads…"
            class="w-full sm:max-w-sm"
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
        <!-- Tablet and up: a table. -->
        <UTable
          :data="items"
          :columns="columns"
          :loading="loading"
          :ui="{ root: 'hidden md:block rounded-lg border border-default', tr: 'relative' }"
          aria-label="Leads"
        >
          <template #lead-cell="{ row }">
            <div class="min-w-0 space-y-0.5">
              <button
                type="button"
                class="row-link"
                @click="openLead(row.original.id)"
              >
                {{ name(row.original) }}
                <UIcon
                  name="lucide:chevron-right"
                  class="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
              </button>
              <p class="text-xs text-dimmed wrap-anywhere">
                {{ ids(row.original) }}
              </p>
            </div>
          </template>
          <template #contact-cell="{ row }">
            <div class="min-w-0 space-y-0.5">
              <p class="wrap-anywhere text-highlighted">
                {{ row.original.workEmail || NO_VALUE }}
              </p>
              <p
                v-if="row.original.phoneNumber"
                class="text-muted tabular-nums"
              >
                {{ row.original.phoneNumber }}
              </p>
            </div>
          </template>
          <template #interest-cell="{ row }">
            <div
              v-if="interests(row.original).shown.length"
              class="flex flex-wrap gap-1"
            >
              <UBadge
                v-for="product in interests(row.original).shown"
                :key="product"
                :label="product"
                color="neutral"
                variant="soft"
                size="sm"
              />
              <UBadge
                v-if="interests(row.original).more"
                :label="`+${interests(row.original).more}`"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>
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

        <!-- Phone: one card per lead. -->
        <div class="md:hidden">
          <ListSkeleton
            v-if="loading"
            label="Loading leads…"
          />
          <ListEmptyState
            v-else-if="!items.length"
            noun="leads"
            :filtered="isFiltered"
            @clear="clearFilters"
          />
          <ul
            v-else
            class="space-y-3"
            aria-label="Leads"
          >
            <li
              v-for="row in items"
              :key="row.id"
              class="relative space-y-2 rounded-lg border border-default bg-elevated/40 p-4 pe-9"
            >
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="row-link after:rounded-lg"
                  @click="openLead(row.id)"
                >
                  {{ name(row) }}
                </button>
                <UBadge
                  v-if="status(row)"
                  :label="status(row)!.label"
                  :color="status(row)!.color"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p class="text-xs text-dimmed wrap-anywhere">
                {{ ids(row) }}
              </p>
              <div class="min-w-0 text-sm">
                <p
                  v-if="row.workEmail"
                  class="wrap-anywhere text-highlighted"
                >
                  {{ row.workEmail }}
                </p>
                <p
                  v-if="row.phoneNumber"
                  class="text-muted tabular-nums"
                >
                  {{ row.phoneNumber }}
                </p>
              </div>
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
        :page-sizes="LEAD_PAGE_SIZES"
        :page-size="pageSize"
        :disabled="pending"
        @update:page="showPage"
        @update:page-size="setPageSize"
      />

      <LeadDetailSlideover
        :id="openId"
        :row="openRow"
        @close="closeLead"
      />
    </template>
  </UDashboardPanel>
</template>
