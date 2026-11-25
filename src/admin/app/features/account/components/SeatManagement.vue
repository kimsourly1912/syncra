<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { sampleMembers, sampleSeatHistory, sampleSeatTotals } from '../fixtures/account-detail'
import AccountResourceSummary from './AccountResourceSummary.vue'

type Member = (typeof sampleMembers)[number]
type SeatChange = (typeof sampleSeatHistory)[number]

const allActivity = 'All activity'
const activity = ref(allActivity)
const activityTypes = [allActivity, 'Seats added', 'Seats deducted']
const memberSearch = ref('')
const signedFormat = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })

const metrics = [
  { label: 'Total seats', value: sampleSeatTotals.total },
  { label: 'Used seats', value: sampleSeatTotals.used },
  { label: 'Available seats', value: sampleSeatTotals.total - sampleSeatTotals.used },
]

const memberColumns: TableColumn<Member>[] = [
  { accessorKey: 'name', header: 'Name', meta: { class: { td: 'font-medium text-highlighted' } } },
  { accessorKey: 'email', header: 'Email', meta: { class: { td: 'wrap-anywhere whitespace-normal' } } },
  { accessorKey: 'role', header: 'Role', meta: { class: { td: 'whitespace-normal' } } },
  { accessorKey: 'status', header: 'Status' },
]
const historyColumns: TableColumn<SeatChange>[] = [
  { accessorKey: 'activity', header: 'Activity', meta: { class: { td: 'font-medium whitespace-normal text-highlighted' } } },
  { accessorKey: 'actor', header: 'Actor', meta: { class: { td: 'whitespace-normal' } } },
  { accessorKey: 'change', header: 'Change', meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } } },
  { accessorKey: 'date', header: 'Date' },
]
const tableUi = { thead: 'bg-elevated/50', th: 'px-3 py-2.5', td: 'px-3 py-2.5' }

const members = computed(() => {
  const query = memberSearch.value.toLowerCase()
  return sampleMembers.filter(member => [member.name, member.email, member.role].some(value => value.toLowerCase().includes(query)))
})
const history = computed(() => sampleSeatHistory.filter(row => activity.value === allActivity || row.activity === activity.value))
</script>

<template>
  <div class="min-w-0 space-y-4">
    <AccountResourceSummary
      heading="Account seats"
      :metrics="metrics"
    >
      <template #actions>
        <UButton
          label="Deduct seats"
          icon="lucide:minus"
          color="neutral"
          variant="outline"
          disabled
        />
        <UButton
          label="Add seats"
          icon="lucide:plus"
          disabled
        />
      </template>
      <template #metric-detail="{ label }">
        <UProgress
          v-if="label === 'Used seats'"
          :model-value="sampleSeatTotals.used"
          :max="sampleSeatTotals.total"
          aria-hidden="true"
          size="sm"
          class="mt-1 max-w-64"
        />
      </template>
    </AccountResourceSummary>

    <div class="grid gap-4 @min-[63rem]:grid-cols-[minmax(0,58fr)_minmax(0,42fr)]">
      <UCard
        as="section"
        aria-label="Members"
        class="min-w-0"
        :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
              <UIcon
                name="lucide:users"
                class="size-5 text-primary"
              />
              Members
            </h2>
            <InputSearch
              v-model="memberSearch"
              placeholder="Search members…"
              class="w-full sm:w-56"
            />
          </div>
        </template>
        <UTable
          :data="members"
          :columns="memberColumns"
          :ui="tableUi"
        >
          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              color="success"
              variant="subtle"
            />
          </template>
          <template #empty>
            <ListEmptyState
              noun="members"
              :filtered="!!memberSearch"
              @clear="memberSearch = ''"
            />
          </template>
        </UTable>
      </UCard>

      <UCard
        as="section"
        aria-label="Seat change history"
        class="min-w-0"
        :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
              <UIcon
                name="lucide:history"
                class="size-5 text-primary"
              />
              Seat change history
            </h2>
            <USelect
              v-model="activity"
              :items="activityTypes"
              aria-label="Seat activity"
              class="w-40"
            />
          </div>
        </template>
        <UTable
          :data="history"
          :columns="historyColumns"
          :ui="tableUi"
        >
          <template #change-cell="{ row }">
            <span
              class="font-medium"
              :class="row.original.change > 0 ? 'text-success' : 'text-highlighted'"
            >
              {{ signedFormat.format(row.original.change) }}
            </span>
          </template>
          <template #empty>
            <ListEmptyState
              noun="seat changes"
              :filtered="activity !== allActivity"
              @clear="activity = allActivity"
            />
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>
