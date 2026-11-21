<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton } from '#components'
import { useSortable } from '@vueuse/integrations/useSortable'

interface Data {
  id: string
  icon: string
  name: string
  detail: string
  status: string
  lastUpdate: string
  description: string
}

const data = shallowRef(Array.from({ length: 5 }, (_, idx) => ({
  id: `00${idx}`,
  name: 'Doc AI',
  status: idx % 2 === 0 ? 'Activated' : 'Deactivated',
  description: 'this is my description',
  detail: 'Coming Soon',
  icon: '/img/doc-ai.png',
  lastUpdate: new Date().toUTCString(),
})) satisfies Data[])

const columns = computed(() => {
  return [
    {
      id: 'handler',
      cell() {
        return h(UButton, { icon: 'lucide:grip-vertical', variant: 'link', color: 'neutral' })
      },
    },
    {
      accessorKey: 'id',
      header: 'Product ID',
    },
    {
      accessorKey: 'icon',
      header: 'Product Icon',
      cell({ row }) {
        const { icon } = row.original
        return h('div', {
          class: 'size-14 rounded-lg bg-muted flex items-center justify-center',
        },
        h('img', { src: icon, width: 56 }))
      },
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
    },
    {
      accessorKey: 'description',
      header: 'Product Description',
    },
    {
      accessorKey: 'detail',
      header: 'Detail Page',
      cell({ row }) {
        const { detail } = row.original
        return h('span', { class: 'text-muted' }, detail)
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell({ row }) {
        const { status } = row.original
        return h(UBadge, { label: status, color: 'success', size: 'lg', variant: 'soft' })
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

useSortable('.product-table', data)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:package"
        title="Product Management"
      >
        <template #right>
          <UButton
            label="Create New Product"
            to="/product/create"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- Static page: the search isn't wired to an API yet. -->
          <InputSearch
            placeholder="Search products…"
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
        :ui="{
          tbody: 'product-table',
        }"
      />
    </template>
  </UDashboardPanel>
</template>
