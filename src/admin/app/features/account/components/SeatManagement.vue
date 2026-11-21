<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CardBoxItem } from '@/types/components/card'
import CardTitle from '~/components/card/CardTitle.vue'
import { tableTheme } from '@/theme/table'

interface SeatTableData {
  type: string
  actor: string
  date: string
  seatChange: number
}

interface MemberTableData {
  name: string
  email: string
  role: string
  status: string
}

const seatItems: CardBoxItem[] = [
  {
    label: 'Used Seat',
    value: '20',
    color: 'neutral',
    icon: 'lucide:users',
  },
  {
    label: 'Used Seat',
    value: '6',
    color: 'neutral',
    icon: 'lucide:user-check',
  },
  {
    label: 'Available Seat',
    value: '14',
    color: 'neutral',
    icon: 'lucide:user-round-plus',
  },
]

const seatTableData = Array.from({ length: 5 }, _ => ({
  actor: 'Syncra',
  date: new Date().toISOString(),
  seatChange: 10,
  type: 'Add Seat',
}) satisfies SeatTableData)

const memberTableData = Array.from({ length: 5 }, _ => ({
  email: 'suci@gmail.com',
  name: 'John Doe',
  role: 'Operator',
  status: 'Active',
}) satisfies MemberTableData)

const seatTableColumn = computed(() => {
  return [
    {
      accessorKey: 'type',
      header: 'Activity Type',
    },
    {
      accessorKey: 'actor',
      header: 'Actor',
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
    {
      accessorKey: 'seatChange',
      header: 'Seat Change',
    },
  ] satisfies TableColumn<SeatTableData>[]
})

const memberTableColumn = computed(() => {
  return [
    {
      accessorKey: 'name',
      header: 'User Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ] satisfies TableColumn<MemberTableData>[]
})
</script>

<template>
  <header class="flex items-center gap-4 justify-between flex-wrap">
    <CardTitle title="Account Seats" />

    <div class="flex gap-4 flex-wrap">
      <UButton
        label="Deduct Seat"
        icon="lucide:minus"
        variant="outline"
        color="error"
      />
      <UButton
        label="Add Seat"
        icon="lucide:plus"
      />
    </div>
  </header>

  <CardBoxWrapper :cols="3">
    <CardBoxItem :items="seatItems" />
  </CardBoxWrapper>

  <section class="space-y-4">
    <CardTitle title="Seats Management History" />

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
      :data="seatTableData"
      :columns="seatTableColumn"
      :ui="tableTheme"
    />
  </section>

  <section class="space-y-4">
    <CardTitle title="Member Detail" />

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
      :data="memberTableData"
      :columns="memberTableColumn"
      :ui="tableTheme"
    />
  </section>
</template>
