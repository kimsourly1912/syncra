<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CardBoxItem } from '@/types/components/card'
import CardTitle from '~/components/card/CardTitle.vue'
import { tableTheme } from '@/theme/table'

interface TokenTableData {
  activity: string
  actor: string
  type: string
  amount: number
  balance: number
  date: string
}

const tokenItems: CardBoxItem[] = [
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
  <header class="flex items-center gap-4 justify-between flex-wrap">
    <CardTitle title="Token Balance" />

    <div class="flex gap-4 flex-wrap">
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
  </header>

  <CardBoxWrapper :cols="3">
    <CardBoxItem :items="tokenItems">
      <template #bottom="{ theme, item }">
        <section :class="[theme.title, 'flex items-center gap-2']">
          <div class="rounded-full bg-default border-4 border-primary/25 inline-flex items-center justify-center">
            <NuxtImg
              src="/img/coin.png"
              class="size-6"
            />
          </div>
          {{ item.value }}
        </section>
      </template>
    </CardBoxItem>
  </CardBoxWrapper>

  <section class="space-y-4">
    <CardTitle title="Token Transaction History" />

    <section class="grid grid-cols-1 sm:grid-cols-12 gap-4">
      <UInput
        icon="lucide:search"
        placeholder="Search"
        class="lg:col-span-9 sm:col-span-6"
      />

      <USelect
        placeholder="Activity"
        :items="['Completed', 'Pending']"
        class="lg:col-span-3 sm:col-span-6"
      />
    </section>

    <UTable
      :data="tokenTableData"
      :columns="tokenTableColumn"
      :ui="tableTheme"
    />
  </section>
</template>
