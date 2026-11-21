<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton } from '#components'
import type { CardBoxItem } from '@/types/components/card'
import { tableTheme } from '@/theme/table'

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
    {
      id: 'action',
      header: 'Action',
      cell({ row }) {
        const { id } = row.original
        return h(UButton, { to: `/lead-inquiry/${id}`, label: 'Review' })
      },
    },
  ] satisfies TableColumn<LeadTableData>[]
})

const overviewItems: CardBoxItem[] = [
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
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Lead Inquiries"
        description="Manage and Track incoming leads inquiries"
      />

      <CardBoxWrapper :cols="5">
        <CardBoxItem :items="overviewItems" />
      </CardBoxWrapper>

      <section class="space-y-4">
        <section class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <UInput
            icon="lucide:search"
            placeholder="Search"
            class="lg:col-span-9 sm:col-span-6"
          />

          <USelect
            placeholder="Onboarding Status"
            :items="['Completed', 'Pending']"
            class="lg:col-span-3 sm:col-span-6"
          />
        </section>

        <UTable
          :data="leadTableData"
          :columns="leadTableColumn"
          :ui="tableTheme"
        />
      </section>
    </LayoutContent>
  </div>
</template>
