<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { UseSortableOptions } from '@vueuse/integrations/useSortable'
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

// Reordering. Static page: there's no product API, so the order isn't saved (open question).
// Rows are keyed by product id (`get-row-id`), so after a move Vue moves the row's element
// instead of repainting each row in place, and the slide below follows the right row.
const reduceMotion = usePreferredReducedMotion()
const motion = computed(() => (reduceMotion.value === 'reduce' ? 0 : 220))
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'
// The same products show as table rows from `md` and as cards on a phone; each has its own
// Sortable over the same list, and only the visible one can be dragged.
const TBODY = '.product-table'
const CARDS = '.product-cards'

const announcement = ref('')
const announce = (to: number) => {
  const product = data.value[to]
  if (product) announcement.value = `${product.name} ${product.id} moved to position ${to + 1} of ${data.value.length}.`
}

const itemsOf = (selector: string) => [...(document.querySelector(selector)?.children ?? [])] as HTMLElement[]

// A row and a card both drag a lifted copy of themselves (Sortable's fallback, on touch and mouse
// alike), placed on the body so the table's scroll box doesn't clip it. Out of its table a row's
// cells would lose their column widths, so they're pinned while the row is picked up, and the copy
// lays them out in a line (`.product-drag-item`).
function pinCellWidths(event: { item: HTMLElement }) {
  for (const cell of event.item.children as HTMLCollectionOf<HTMLElement>) {
    cell.style.width = `${cell.getBoundingClientRect().width}px`
  }
}
function unpinCellWidths(event: { item: HTMLElement }) {
  for (const cell of event.item.children as HTMLCollectionOf<HTMLElement>) cell.style.width = ''
}

// Dragging: only from the grip, and the others slide out of the way. `sortablejs` ships no types,
// so VueUse's option type doesn't list Sortable's own options; these are SortableJS 1.15's.
const SHARED = {
  handle: '[data-drag-handle]',
  easing: EASING,
  ghostClass: 'product-row-ghost',
  chosenClass: 'product-row-chosen',
  forceFallback: true,
  fallbackOnBody: true,
  fallbackClass: 'product-drag-item',
  onEnd: (event: { oldIndex?: number, newIndex?: number }) => {
    if (event.newIndex !== undefined && event.newIndex !== event.oldIndex) {
      // `useSortable` updates the list on the next tick.
      void nextTick(() => announce(event.newIndex!))
    }
  },
}
const sortables = [
  useSortable(TBODY, data, {
    ...SHARED,
    animation: motion.value,
    // Pressed (before the copy is made) and released, dropped or not.
    onChoose: pinCellWidths,
    onUnchoose: unpinCellWidths,
  } as UseSortableOptions),
  useSortable(CARDS, data, { ...SHARED, animation: motion.value } as UseSortableOptions),
]
watch(motion, value => sortables.forEach(sortable => sortable.option('animation' as never, value as never)))

/** The keyboard's move (↑/↓ on a grip), with the same slide: each item eases from where it was. */
async function moveRow(from: number, to: number) {
  if (to < 0 || to >= data.value.length) return
  const items = () => [...itemsOf(TBODY), ...itemsOf(CARDS)]
  const before = new Map(items().map(item => [item, item.getBoundingClientRect().top]))

  const next = [...data.value]
  next.splice(to, 0, next.splice(from, 1)[0]!)
  data.value = next
  await nextTick()

  for (const item of items()) {
    const shift = (before.get(item) ?? 0) - item.getBoundingClientRect().top
    if (shift && motion.value) {
      item.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], { duration: motion.value, easing: EASING })
    }
  }
  // Moving the element drops focus; keep it on the visible grip that moved.
  const grips = [itemsOf(TBODY)[to], itemsOf(CARDS)[to]].map(item => item?.querySelector<HTMLElement>('[data-drag-handle]'))
  grips.find(grip => grip?.offsetParent)?.focus()
  announce(to)
}

/** ↑/↓ on a grip moves its row. */
function onGripKeydown(event: KeyboardEvent, index: number) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  event.preventDefault()
  void moveRow(index, index + (event.key === 'ArrowUp' ? -1 : 1))
}

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
        title="Product Management"
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
              class="cursor-grab touch-none text-dimmed hover:text-highlighted active:cursor-grabbing"
              data-drag-handle
              :aria-label="`Reorder ${row.original.name}, position ${row.index + 1}`"
              aria-describedby="product-reorder-hint"
              @keydown="onGripKeydown($event, row.index)"
            />
            <span class="w-5 text-sm text-dimmed tabular-nums">{{ row.index + 1 }}</span>
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
                <span class="text-xs text-dimmed tabular-nums">#{{ row.original.id }}</span>
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
              class="cursor-grab touch-none text-dimmed active:cursor-grabbing"
              data-drag-handle
              :aria-label="`Reorder ${product.name}, position ${index + 1}`"
              aria-describedby="product-reorder-hint"
              @keydown="onGripKeydown($event, index)"
            />
            <span class="text-xs text-dimmed tabular-nums">{{ index + 1 }}</span>
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
              <span class="text-xs text-dimmed tabular-nums">#{{ product.id }}</span>
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
                class="text-xs text-dimmed"
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
