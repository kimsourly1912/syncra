<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CardStat } from '@/components/card/CardStats.vue'

interface TokenTableData {
  activity: string
  actor: string
  type: string
  amount: number
  balance: number
  date: string
}

const tokenItems: CardStat[] = [
  {
    label: 'Current Token Balance',
    value: '10.000',
    color: 'neutral',
    icon: 'lucide:wallet',
  },
  {
    label: 'Total In-flow',
    value: '50.000',
    color: 'success',
    icon: 'lucide:arrow-down-left',
  },
  {
    label: 'Total Out-flow',
    value: '40.000',
    color: 'error',
    icon: 'lucide:arrow-up-right',
  },
]

const tokenTableData = Array.from({ length: 5 }, _ => ({
  activity: 'Testing',
  actor: 'John Doe',
  type: 'Usage',
  amount: 6000,
  balance: 1000,
  date: new Date().toISOString(),
}) satisfies TokenTableData)

const tokenTableColumn = computed(() => {
  return [
    {
      accessorKey: 'activity',
      header: 'Activity',
    },
    {
      accessorKey: 'actor',
      header: 'Actor',
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
    },
    {
      accessorKey: 'balance',
      header: 'Balance After',
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
  ] satisfies TableColumn<TokenTableData>[]
})
</script>

<template>
  <UPageCard
    title="Token Balance"
    variant="naked"
    orientation="horizontal"
  >
    <div class="flex gap-2 flex-wrap lg:justify-end">
      <UButton
        label="Deduct Token"
        icon="lucide:minus"
        variant="outline"
        color="error"
      />
      <UButton
        label="Add Token"
        icon="lucide:plus"
      />
    </div>
  </UPageCard>

  <CardStats :items="tokenItems">
    <template #value="{ item }">
      <div class="rounded-full bg-default border-4 border-primary/25 inline-flex items-center justify-center">
        <img
          src="/img/coin.png"
          class="size-6"
        >
      </div>
      {{ item.value }}
    </template>
  </CardStats>

  <UPageCard
    title="Token Transaction History"
    variant="naked"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <!-- Static panel: the search isn't wired to an API yet. -->
      <InputSearch
        placeholder="Search transactions…"
        class="w-full max-w-sm"
      />
      <USelect
        placeholder="Activity"
        :items="['Completed', 'Pending']"
        class="w-48"
      />
    </div>

    <UTable
      :data="tokenTableData"
      :columns="tokenTableColumn"
    />
  </UPageCard>
</template>
