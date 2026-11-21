<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CardStat } from '@/components/card/CardStats.vue'

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

const seatItems: CardStat[] = [
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
  <UPageCard
    title="Account Seats"
    variant="naked"
    orientation="horizontal"
  >
    <div class="flex gap-2 flex-wrap lg:justify-end">
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
  </UPageCard>

  <CardStats :items="seatItems" />

  <UPageCard
    title="Seats Management History"
    variant="naked"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <UInput
        icon="lucide:search"
        placeholder="Search"
        class="w-full max-w-sm"
      />
      <USelect
        placeholder="Activity"
        :items="['Completed', 'Pending']"
        class="w-48"
      />
    </div>

    <UTable
      :data="seatTableData"
      :columns="seatTableColumn"
    />
  </UPageCard>

  <UPageCard
    title="Member Detail"
    variant="naked"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <UInput
        icon="lucide:search"
        placeholder="Search"
        class="w-full max-w-sm"
      />
      <USelect
        placeholder="Activity"
        :items="['Completed', 'Pending']"
        class="w-48"
      />
    </div>

    <UTable
      :data="memberTableData"
      :columns="memberTableColumn"
    />
  </UPageCard>
</template>
