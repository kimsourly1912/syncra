<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton } from '#components'

interface Data {
  id: string
  name: string
  price: string
  status: string
  lastUpdate: string
  description: string
}

const data = shallowRef(Array.from({ length: 5 }, (_, idx) => ({
  id: `00${idx}`,
  name: 'Doc AI',
  price: 'Starting from $99/Month',
  status: idx % 2 === 0 ? 'Activated' : 'Deactivated',
  description: 'this is my description',
  lastUpdate: new Date().toUTCString(),
})) satisfies Data[])

const columns = computed(() => {
  return [
    {
      accessorKey: 'id',
      header: 'Plan ID',
    },
    {
      accessorKey: 'name',
      header: 'Plan Name',
    },
    {
      accessorKey: 'description',
      header: 'Plan Description',
    },
    {
      accessorKey: 'price',
      header: 'Price Display',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell({ row }) {
        const { status } = row.original
        return h(UBadge, { label: status, color: 'success', variant: 'subtle' })
      },
    },
    {
      accessorKey: 'lastUpdate',
      header: 'Last Update',
    },
    {
      id: 'action',
      header: 'Action',
      cell() {
        return h(UButton, { icon: 'lucide:ellipsis-vertical', variant: 'ghost', color: 'neutral' })
      },
    },
  ] satisfies TableColumn<Data>[]
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:tags"
        title="Plan & Pricing Management"
      >
        <template #right>
          <UButton
            label="Create New Plan"
            to="/plan-pricing/create"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- Static page: the search isn't wired to an API yet. -->
          <InputSearch
            placeholder="Search plans…"
            class="w-full max-w-sm"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :column-pinning="{
          right: ['action'],
        }"
        :data
        :columns
      />
    </template>
  </UDashboardPanel>
</template>
