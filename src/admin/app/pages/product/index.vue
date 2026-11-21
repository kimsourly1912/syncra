<script setup lang="ts">
import { tableTheme } from '@/theme/table'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton, NuxtImg } from '#components'
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
        h((NuxtImg as unknown as string), { src: icon, width: 56 }))
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
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Product Management"
        description="Manage Syncra Product Listing"
      >
        <template #suffix>
          <UButton
            label="Create New Product"
            to="/product/create"
          />
        </template>
      </LayoutHeading>

      <section class="space-y-4">
        <UInput
          icon="lucide:search"
          placeholder="Search"
          class="max-w-sm w-full"
        />
        <UTable
          :column-pinning="{
            right: ['action'],
          }"
          :data
          :columns
          :ui="{
            tbody: 'product-table',
            ...tableTheme,
          }"
        />
      </section>
    </LayoutContent>
  </div>
</template>
