import type { ShallowRef } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { UseSortableOptions } from '@vueuse/integrations/useSortable'
import type { Product } from '../models/product'

/**
 * Reordering the product list: drag a row's or a card's grip (`[data-drag-handle]`), or press ↑/↓
 * on it. The others slide out of the way, and `announcement` (for an `aria-live` region) says
 * where the product went. Static page: there's no product API, so the order isn't saved (open
 * question). Move this to `app/composables` when a second list reorders.
 *
 * The styles for its classes (`product-row-ghost`, `product-row-chosen`, `product-drag-item`)
 * are in ProductListScreen.vue.
 *
 * @example
 * const { announcement, onGripKeydown } = useProductReorder(data)
 * // <tbody class="product-table"> rows and <ul class="product-cards"> cards, each with a grip:
 * // <UButton data-drag-handle @keydown="onGripKeydown($event, index)" … />
 */
export function useProductReorder(data: ShallowRef<Product[]>) {
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

  return { announcement: readonly(announcement), onGripKeydown }
}
