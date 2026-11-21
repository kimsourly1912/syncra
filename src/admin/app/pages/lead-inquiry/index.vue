<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, ULink } from '#components'
import type { CardStat } from '@/components/card/CardStats.vue'

interface LeadTableData {
  id: string
  name: string
  email: string
  phone: string
  status: string
  companyName: string
}

const leadTableData = Array.from({ length: 5 }, (_, idx) => ({
  id: `${idx}`,
  companyName: 'Testing',
  name: 'John Doe',
  email: 'Suci@gmail.com',
  phone: '+85511122233',
  status: 'New',
}) satisfies LeadTableData)

const leadTableColumn = computed(() => {
  return [
    {
      accessorKey: 'id',
      header: 'Lead ID',
      cell({ row }) {
        const { id } = row.original
        return `L-${id}`
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      // The name opens the lead (no separate Review column).
      cell({ row }) {
        const { id, name } = row.original
        return h(ULink, { to: `/lead-inquiry/${id}`, class: 'font-medium text-highlighted hover:text-primary' }, () => name)
      },
    },
    {
      accessorKey: 'companyName',
      header: 'Company Name',
    },
    {
      accessorKey: 'email',
      header: 'Email address',
    },
    {
      accessorKey: 'phone',
      header: 'Phone Number',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell({ row }) {
        const { status } = row.original
        return h(UBadge, { color: 'primary', label: status, variant: 'soft', size: 'lg' })
      },
    },
  ] satisfies TableColumn<LeadTableData>[]
})

const overviewItems: CardStat[] = [
  {
    label: 'Lead Received',
    icon: 'lucide:inbox',
    value: '100',
    color: 'primary',
  },
  {
    label: 'New',
    icon: 'lucide:badge-plus',
    value: '10',
    color: 'info',
  },
  {
    label: 'Converted',
    icon: 'lucide:circle-check',
    value: '70',
    color: 'success',
  },
  {
    label: 'Contacted',
    icon: 'lucide:phone',
    value: '23',
    color: 'secondary',
  },
  {
    label: 'Rejected',
    icon: 'lucide:circle-x',
    value: '65',
    color: 'error',
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Lead Inquiries" />

      <UDashboardToolbar>
        <template #left>
          <UInput
            icon="lucide:search"
            placeholder="Search"
            class="w-full max-w-sm"
          />
        </template>
        <template #right>
          <USelect
            placeholder="Onboarding Status"
            :items="['Completed', 'Pending']"
            class="w-48"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <CardStats :items="overviewItems" />

      <UTable
        :data="leadTableData"
        :columns="leadTableColumn"
      />
    </template>
  </UDashboardPanel>
</template>
