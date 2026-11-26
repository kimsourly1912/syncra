<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { useProductReorder } from '../composables/useProductReorder'
import { SAMPLE_PRODUCTS } from '../fixtures/products'
import type { Product } from '../models/product'

// Static page: sample rows until the product API exists (open question). The navbar says so.
const data = shallowRef<Product[]>([...SAMPLE_PRODUCTS])

// Only Edit leads anywhere (a placeholder page); the rest wait for the product API.
const actions = (product: Product): DropdownMenuItem[][] => [
  [{ label: 'Edit', icon: 'lucide:pencil', to: `/product/${product.id}` }],
  [{ label: product.active ? 'Deactivate' : 'Activate', icon: product.active ? 'lucide:circle-pause' : 'lucide:circle-play', disabled: true }],
  [{ label: 'Delete', icon: 'lucide:trash-2', color: 'error', disabled: true }],
]

// Reordering: drag a grip, or ↑/↓ on it. Not saved (no product API).
const { announcement, onGripKeydown } = useProductReorder(data)

// Cells are the template's `#<id>-cell` slots.
const columns: TableColumn<Product>[] = [
  { id: 'order', header: () => h('span', { class: 'sr-only' }, 'Order'), meta: { class: { th: 'w-20', td: 'w-20' } } },
  { id: 'product', header: 'Product' },
  { id: 'detail', header: 'Detail page' },
  { id: 'status', header: 'Status' },
  { id: 'updated', header: 'Updated' },
  { id: 'action', header: () => h('span', { class: 'sr-only' }, 'Actions'), meta: { class: { th: 'w-14', td: 'w-14 text-right' } } },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:package"
        title="Product management"
      >
        <template #right>
          <UBadge
            label="Sample data"
            color="neutral"
            variant="subtle"
            class="hidden sm:inline-flex"
          />
          <!-- Icon only on a phone, so the title keeps its room. -->
          <UButton
            icon="lucide:plus"
            to="/product/create"
            aria-label="New product"
          >
            <span class="hidden sm:inline">New product</span>
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- Static page: the search isn't wired to an API yet. -->
          <InputSearch
            placeholder="Search products…"
            class="w-full sm:max-w-sm"
          />
        </template>
        <template #right>
          <p class="hidden text-sm whitespace-nowrap text-muted md:block">
            {{ data.length }} products · drag <UIcon
              name="lucide:grip-vertical"
              class="inline size-3.5 align-[-2px]"
              aria-hidden="true"
            /> to set the order
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :column-pinning="{ right: ['action'] }"
        :data
        :columns
        :get-row-id="(row: Product) => row.id"
        :ui="{ root: 'hidden md:block rounded-lg border border-default', tbody: 'product-table' }"
        aria-label="Products"
      >
        <template #order-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              icon="lucide:grip-vertical"
              variant="ghost"
              color="neutral"
              class="cursor-grab touch-none text-muted hover:text-highlighted active:cursor-grabbing"
              data-drag-handle
              :aria-label="`Reorder ${row.original.name}, position ${row.index + 1}`"
              aria-describedby="product-reorder-hint"
              @keydown="onGripKeydown($event, row.index)"
            />
            <span class="w-5 text-sm text-muted tabular-nums">{{ row.index + 1 }}</span>
          </div>
        </template>

        <template #product-cell="{ row }">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <img
                :src="row.original.icon"
                alt=""
                class="size-7"
              >
            </span>
            <div class="min-w-0">
              <p class="flex items-baseline gap-2">
                <ULink
                  :to="`/product/${row.original.id}`"
                  class="font-medium text-highlighted hover:text-primary"
                >
                  {{ row.original.name }}
                </ULink>
                <span class="text-xs text-muted tabular-nums">#{{ row.original.id }}</span>
              </p>
              <p class="max-w-sm truncate text-sm text-muted">
                {{ row.original.description }}
              </p>
            </div>
          </div>
        </template>

        <template #detail-cell="{ row }">
          <UBadge
            v-if="row.original.detailLive"
            label="Live"
            icon="lucide:globe"
            color="primary"
            variant="subtle"
          />
          <UBadge
            v-else
            label="Coming soon"
            icon="lucide:clock"
            color="neutral"
            variant="outline"
          />
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :label="row.original.active ? 'Active' : 'Inactive'"
            :color="row.original.active ? 'success' : 'neutral'"
            variant="subtle"
          />
        </template>

        <template #updated-cell="{ row }">
          <span
            class="text-muted whitespace-nowrap"
            :title="formatAge(row.original.updatedAt).full"
          >{{ formatAge(row.original.updatedAt).age }}</span>
        </template>

        <template #action-cell="{ row }">
          <UDropdownMenu
            :items="actions(row.original)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="lucide:ellipsis-vertical"
              variant="ghost"
              color="neutral"
              :aria-label="`Actions for ${row.original.name}`"
            />
          </UDropdownMenu>
        </template>
      </UTable>

      <!-- Phone: one card per product, dragged by its grip like the rows. -->
      <!-- The sentence is one inline span, so it wraps as text (not word by word as flex items). -->
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted md:hidden">
        <UBadge
          label="Sample data"
          color="neutral"
          variant="subtle"
          size="sm"
          class="sm:hidden"
        />
        <span>
          {{ data.length }} products · drag <UIcon
            name="lucide:grip-vertical"
            class="inline size-3.5 align-[-2px]"
            aria-hidden="true"
          /> to reorder
        </span>
      </div>
      <ul
        class="product-cards space-y-3 md:hidden"
        aria-label="Products"
      >
        <li
          v-for="(product, index) in data"
          :key="product.id"
          class="flex gap-2 rounded-lg border border-default bg-default p-3"
        >
          <div class="flex shrink-0 flex-col items-center">
            <UButton
              icon="lucide:grip-vertical"
              variant="ghost"
              color="neutral"
              class="cursor-grab touch-none text-muted active:cursor-grabbing"
              data-drag-handle
              :aria-label="`Reorder ${product.name}, position ${index + 1}`"
              aria-describedby="product-reorder-hint"
              @keydown="onGripKeydown($event, index)"
            />
            <span class="text-xs text-muted tabular-nums">{{ index + 1 }}</span>
          </div>

          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <img
              :src="product.icon"
              alt=""
              class="size-7"
            >
          </span>

          <div class="min-w-0 flex-1 space-y-1.5">
            <p class="flex flex-wrap items-baseline gap-x-2">
              <ULink
                :to="`/product/${product.id}`"
                class="font-medium wrap-anywhere text-highlighted hover:text-primary"
              >
                {{ product.name }}
              </ULink>
              <span class="text-xs text-muted tabular-nums">#{{ product.id }}</span>
            </p>
            <p class="line-clamp-2 text-sm text-muted">
              {{ product.description }}
            </p>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                :label="product.active ? 'Active' : 'Inactive'"
                :color="product.active ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
              <UBadge
                :label="product.detailLive ? 'Live' : 'Coming soon'"
                :icon="product.detailLive ? 'lucide:globe' : 'lucide:clock'"
                :color="product.detailLive ? 'primary' : 'neutral'"
                :variant="product.detailLive ? 'subtle' : 'outline'"
                size="sm"
              />
              <span
                class="text-xs text-muted"
                :title="formatAge(product.updatedAt).full"
              >Updated {{ formatAge(product.updatedAt).age }}</span>
            </div>
          </div>

          <UDropdownMenu
            :items="actions(product)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="lucide:ellipsis-vertical"
              variant="ghost"
              color="neutral"
              class="-me-1 -mt-1 self-start"
              :aria-label="`Actions for ${product.name}`"
            />
          </UDropdownMenu>
        </li>
      </ul>
      <p
        id="product-reorder-hint"
        class="sr-only"
      >
        Drag the grip, or press the up or down arrow, to move the product.
      </p>
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ announcement }}
      </p>
    </template>
  </UDashboardPanel>
</template>

<style>
/*
 * SortableJS adds these to rows and cards rendered inside other components, so they can't be
 * scoped. The placeholder is an empty drop slot the item's size: its contents are hidden (the
 * pinned Action cell's own background with them) and it shows a tinted, dashed outline, which
 * follows a card's rounded corners.
 */
.product-row-ghost {
  background: color-mix(in oklab, var(--ui-primary) 6%, transparent);
  outline: 2px dashed color-mix(in oklab, var(--ui-primary) 45%, transparent);
  outline-offset: -6px;
}
li.product-row-ghost {
  border-color: transparent;
  outline-offset: -2px;
}
.product-row-ghost > * {
  visibility: hidden;
}
/* Picked up, before the drag starts: a hint of the slot to come. */
.product-row-chosen {
  background: color-mix(in oklab, var(--ui-primary) 4%, transparent);
}

/* The lifted copy under the pointer or finger: opaque, raised, slightly tilted. */
.product-drag-item {
  opacity: 1 !important;
  background: var(--ui-bg);
  border: 1px solid color-mix(in oklab, var(--ui-primary) 40%, transparent);
  border-radius: calc(var(--ui-radius) * 2);
  box-shadow: 0 16px 32px -12px rgb(0 0 0 / 0.3);
  rotate: 1.5deg;
}
/* A row out of its table: its cells (widths pinned on pick-up) in one line, and a smaller tilt,
   since a full-width row tilts far at its ends. */
tr.product-drag-item {
  display: flex;
  align-items: center;
  overflow: hidden;
  rotate: 0.4deg;
}
tr.product-drag-item > td {
  flex: none;
  border: 0;
  background: transparent;
}
</style>
