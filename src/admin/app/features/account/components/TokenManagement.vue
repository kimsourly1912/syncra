<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { sampleTokenHistory, sampleTokenTotals } from '../fixtures/account-detail'
import AccountResourceSummary from './AccountResourceSummary.vue'

type Transaction = (typeof sampleTokenHistory)[number]

const allActivity = 'All activity'
const activityTypes = [allActivity, 'Credit', 'Usage']
const activityType = ref(allActivity)
const search = ref('')
const numberFormat = new Intl.NumberFormat('en-US')
const signedFormat = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })

const metrics = [
  { label: 'Current balance', value: sampleTokenTotals.balance, emphasized: true },
  { label: 'Total inflow', value: sampleTokenTotals.inflow },
  { label: 'Total outflow', value: sampleTokenTotals.outflow },
]

const columns: TableColumn<Transaction>[] = [
  { accessorKey: 'activity', header: 'Activity', meta: { class: { td: 'font-medium text-highlighted' } } },
  { accessorKey: 'actor', header: 'Actor' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'amount', header: 'Amount', meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } } },
  {
    accessorKey: 'balance',
    header: 'Balance after',
    meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } },
    cell: ({ row }) => numberFormat.format(row.original.balance),
  },
  { accessorKey: 'date', header: 'Date' },
]

const transactions = computed(() => {
  const query = search.value.toLowerCase()
  return sampleTokenHistory.filter(row => (activityType.value === allActivity || row.type === activityType.value)
    && [row.activity, row.actor, row.type].some(value => value.toLowerCase().includes(query)))
})
function clearFilters() {
  search.value = ''
  activityType.value = allActivity
}
</script>

<template>
  <div class="min-w-0 space-y-4">
    <AccountResourceSummary
      heading="Token balance"
      :metrics="metrics"
    >
      <template #actions>
        <UButton
          label="Deduct tokens"
          icon="lucide:minus"
          color="neutral"
          variant="outline"
          disabled
        />
        <UButton
          label="Add tokens"
          icon="lucide:plus"
          disabled
        />
      </template>
    </AccountResourceSummary>

    <UCard
      as="section"
      aria-label="Transaction history"
      :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'p-0 sm:p-0' }"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-highlighted">
            Transaction history
          </h2>
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <InputSearch
              v-model="search"
              placeholder="Search transactions…"
              class="w-full sm:w-60"
            />
            <USelect
              v-model="activityType"
              :items="activityTypes"
              aria-label="Transaction activity"
              class="w-full sm:w-36"
            />
          </div>
        </div>
      </template>

      <!-- A narrow panel (below 40rem) lists transactions as rows of two lines instead of a table. -->
      <ul
        v-if="transactions.length"
        class="divide-y divide-default @min-[40rem]:hidden"
        aria-label="Transactions"
      >
        <li
          v-for="(row, index) in transactions"
          :key="index"
          class="flex items-start justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0 space-y-0.5">
            <p class="text-sm font-medium text-highlighted">
              {{ row.activity }}
            </p>
            <p class="text-xs text-muted">
              {{ row.actor }} · {{ row.date }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p
              class="text-sm font-medium tabular-nums"
              :class="row.amount > 0 ? 'text-success' : 'text-highlighted'"
            >
              {{ signedFormat.format(row.amount) }}
            </p>
            <p class="text-xs text-muted tabular-nums">
              Balance {{ numberFormat.format(row.balance) }}
            </p>
          </div>
        </li>
      </ul>
      <div
        v-else
        class="@min-[40rem]:hidden"
      >
        <ListEmptyState
          noun="transactions"
          :filtered="!!search || activityType !== allActivity"
          @clear="clearFilters"
        />
      </div>

      <UTable
        :data="transactions"
        :columns="columns"
        :ui="{ root: 'hidden @min-[40rem]:block', thead: 'bg-elevated/50', th: 'px-4 py-2.5', td: 'px-4 py-2.5' }"
      >
        <template #type-cell="{ row }">
          <UBadge
            :label="row.original.type"
            :color="row.original.type === 'Credit' ? 'success' : 'neutral'"
            variant="subtle"
          />
        </template>
        <template #amount-cell="{ row }">
          <span
            class="font-medium"
            :class="row.original.amount > 0 ? 'text-success' : 'text-highlighted'"
          >
            {{ signedFormat.format(row.original.amount) }}
          </span>
        </template>
        <template #empty>
          <ListEmptyState
            noun="transactions"
            :filtered="!!search || activityType !== allActivity"
            @clear="clearFilters"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>
