<script setup lang="ts">
/**
 * The keyboard shortcuts, for reference only. Opened from the staff menu, the search palette, or
 * `?`. `meta` shows as ⌘ on a Mac and Ctrl elsewhere. Keep the list in step with the shortcuts
 * that exist (`layouts/default.vue`, `InputSearch`, the product order, the plan form).
 */
const open = defineModel<boolean>('open', { default: false })

const GROUPS: { heading: string, shortcuts: { keys: string[], description: string }[] }[] = [
  {
    heading: 'Anywhere',
    shortcuts: [
      { keys: ['meta', 'K'], description: 'Search pages' },
      { keys: ['meta', 'B'], description: 'Show or hide the sidebar' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close a dialog, panel, or menu' },
    ],
  },
  {
    heading: 'Lists',
    shortcuts: [
      { keys: ['/'], description: 'Go to the search box' },
      { keys: ['Enter'], description: 'Search right away' },
    ],
  },
  {
    heading: 'Products and plans',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Move a product up or down (on its grip)' },
      { keys: ['Enter'], description: 'Add the next key feature (in a plan\'s feature)' },
    ],
  },
]
</script>

<template>
  <UModal
    v-model:open="open"
    title="Keyboard shortcuts"
    description="The Anywhere shortcuts pause while you're typing in a field."
  >
    <template #body>
      <div class="space-y-5">
        <section
          v-for="group in GROUPS"
          :key="group.heading"
          :aria-labelledby="`shortcuts-${group.heading}`"
        >
          <h3
            :id="`shortcuts-${group.heading}`"
            class="mb-1 text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ group.heading }}
          </h3>
          <dl class="divide-y divide-default">
            <div
              v-for="shortcut in group.shortcuts"
              :key="shortcut.description"
              class="flex items-center justify-between gap-4 py-2"
            >
              <dt class="text-sm text-highlighted">
                {{ shortcut.description }}
              </dt>
              <dd class="flex shrink-0 items-center gap-1">
                <UKbd
                  v-for="key in shortcut.keys"
                  :key="key"
                  :value="key"
                />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </UModal>
</template>
