<script setup lang="ts">
import type { CommandPaletteGroup, DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useSignOut } from '@/features/auth'
import { useSession } from '@/features/session'
import type { RouteNamedMap } from 'vue-router/auto-routes'

const signOut = useSignOut()
const { staff } = useSession()
const router = useRouter()
const route = useRoute()

/** Other paths whose pages belong to a sidebar section, besides the pages under its own link. */
const SECTION_PATHS: Record<string, string[]> = {
  '/': ['/account'],
}

/**
 * The sidebar, top to bottom: headings, and links to pages by route name (typed: a renamed or
 * missing page fails typecheck). A link is labeled with its page's `title` (`definePageMeta`), so
 * it reads the same as the browser tab of the page it opens.
 */
const MENU: ({ heading: string } | { page: keyof RouteNamedMap, icon: string })[] = [
  { heading: 'Customer Portal' },
  { page: 'index', icon: 'lucide:building-2' },
  { page: 'techpack-reviews', icon: 'lucide:file-check' },
  { page: 'sale-request', icon: 'lucide:shopping-cart' },
  { heading: 'Website management' },
  { page: 'lead-inquiry', icon: 'lucide:inbox' },
  { page: 'hero', icon: 'lucide:panels-top-left' },
  { page: 'product', icon: 'lucide:package' },
  { page: 'plan-pricing', icon: 'lucide:tags' },
  { page: 'community', icon: 'lucide:users' },
  { heading: 'System' },
  { page: 'setting', icon: 'lucide:settings' },
]

// A heading left with no links is hidden.
const pages = new Map(router.getRoutes().map(page => [page.name, page]))
const links = MENU.flatMap((item): NavigationMenuItem[] => {
  if ('heading' in item) return [{ label: item.heading, type: 'label' }]
  const page = pages.get(item.page)
  if (!page) return []
  if (import.meta.dev && !page.meta.title) console.warn(`[sidebar] ${page.path} has no definePageMeta({ title }).`)
  return [{ label: page.meta.title ?? page.path, icon: item.icon, to: page.path }]
})
const visibleItems = links.filter((item, index) => item.type !== 'label' || (links[index + 1] && links[index + 1]!.type !== 'label'))

// The section stays highlighted on the pages under it (a review, an account, a create form).
const sidebarItems = computed(() => visibleItems.map(item => (typeof item.to === 'string'
  ? { ...item, active: isSectionActive(route.path, item.to, SECTION_PATHS[item.to]) }
  : item)))

// Keyboard: Ctrl/⌘+B shows or hides the sidebar (collapses it on a wide screen, opens or closes
// the drawer below `lg`), and `?` lists every shortcut. Both pause while typing in a field.
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const wide = useBreakpoints(breakpointsTailwind).greaterOrEqual('lg')
const shortcutsOpen = ref(false)

defineShortcuts({
  'meta_b': () => {
    if (wide.value) sidebarCollapsed.value = !sidebarCollapsed.value
    else sidebarOpen.value = !sidebarOpen.value
  },
  '?': () => {
    shortcutsOpen.value = true
  },
})

// Ctrl/⌘+K or the sidebar's Search button: go to any page in the sidebar, or see the shortcuts.
// Nuxt UI adds the light/dark commands.
const searchGroups: CommandPaletteGroup[] = [
  {
    id: 'pages',
    label: 'Go to',
    items: visibleItems
      .filter(item => item.type !== 'label')
      .map(item => ({ label: item.label, icon: item.icon as string | undefined, to: item.to })),
  },
  {
    id: 'help',
    label: 'Help',
    items: [{ label: 'Keyboard shortcuts', icon: 'lucide:keyboard', kbds: ['?'], onSelect: () => { shortcutsOpen.value = true } }],
  },
]

// The signed-in staff member's menu, at the bottom of the sidebar.
const staffName = computed(() => staff.value?.username || staff.value?.email || 'Account')
const staffMenu = computed<DropdownMenuItem[][]>(() => [
  [{ label: staff.value?.email ?? staffName.value, type: 'label' }],
  [{ label: 'Keyboard shortcuts', icon: 'lucide:keyboard', kbds: ['?'], onSelect: () => { shortcutsOpen.value = true } }],
  [{ label: 'Log out', icon: 'lucide:log-out', disabled: signOut.pending.value, onSelect: () => void signOut.submit() }],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-model:collapsed="sidebarCollapsed"
      v-model:open="sidebarOpen"
      collapsible
      resizable
      :default-size="17"
      :max-size="24"
      :ui="{ header: 'lg:border-b lg:border-default', footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          v-if="!collapsed"
          to="/"
          class="flex items-center gap-3 text-xl font-semibold text-highlighted"
        >
          <img
            src="/img/syncra-logo.png"
            alt="Syncra"
            class="size-8"
          >
          Syncra
        </NuxtLink>
        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed
          label="Search"
          class="bg-transparent ring-default"
        />
        <UNavigationMenu
          :items="sidebarItems"
          :collapsed
          orientation="vertical"
          tooltip
          :ui="{ label: 'mt-3 pb-1 [li:first-child>&]:mt-0' }"
        />
      </template>

      <template #footer="{ collapsed }">
        <div
          class="flex w-full items-center gap-1"
          :class="{ 'flex-col': collapsed }"
        >
          <UDropdownMenu
            :items="staffMenu"
            :content="{ align: 'start', side: 'top' }"
            class="min-w-0 flex-1"
          >
            <UButton
              :label="collapsed ? undefined : staffName"
              :aria-label="collapsed ? staffName : undefined"
              icon="lucide:circle-user"
              color="neutral"
              variant="ghost"
              block
              :square="collapsed"
              :loading="signOut.pending.value"
              class="justify-start"
            />
          </UDropdownMenu>
          <UColorModeButton />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />

    <UDashboardSearch
      :groups="searchGroups"
      placeholder="Search pages…"
      title="Search"
      description="Go to a page in Syncra Admin"
    />

    <ModalShortcuts v-model:open="shortcutsOpen" />
  </UDashboardGroup>
</template>
