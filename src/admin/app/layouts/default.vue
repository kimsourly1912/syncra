<script setup lang="ts">
import type { CommandPaletteGroup, DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useSignOut } from '@/features/auth'
import { useSession } from '@/features/session'

const signOut = useSignOut()
const { staff } = useSession()
const router = useRouter()
const route = useRoute()

/** Other paths whose pages belong to a sidebar section, besides the pages under its own link. */
const SECTION_PATHS: Record<string, string[]> = {
  '/': ['/account'],
}

const menuItems: NavigationMenuItem[] = [
  {
    label: 'Customer Portal',
    type: 'label',
  },
  {
    label: 'Account Management',
    icon: 'lucide:building-2',
    to: '/',
  },
  {
    label: 'TechPack Reviews',
    icon: 'lucide:file-check',
    to: '/techpack-reviews',
  },
  {
    label: 'Sale Request',
    icon: 'lucide:shopping-cart',
    to: '/sale-request',
  },
  {
    label: 'Website Management',
    type: 'label',
  },
  {
    label: 'Lead Inquiry',
    icon: 'lucide:inbox',
    to: '/lead-inquiry',
  },
  {
    label: 'HeroPage Management',
    icon: 'lucide:panels-top-left',
    to: '/hero',
  },
  {
    label: 'Product Management',
    icon: 'lucide:package',
    to: '/product',
  },
  {
    label: 'Plan & Pricing Management',
    icon: 'lucide:tags',
    to: '/plan-pricing',
  },
  {
    label: 'Community Management',
    icon: 'lucide:users',
    to: '/community',
  },
  {
    label: 'System',
    type: 'label',
  },
  {
    label: 'Setting',
    icon: 'lucide:settings',
    to: '/setting',
  },
]

// Links to pages that don't exist yet are hidden, and so is a heading left with no links.
// Checked against the route table: `router.resolve` warns for every unknown path.
const routePaths = new Set(router.getRoutes().map(route => route.path))
const links = menuItems.filter(item => item.type === 'label' || routePaths.has(item.to as string))
const visibleItems = links.filter((item, index) => item.type !== 'label' || (links[index + 1] && links[index + 1]!.type !== 'label'))

// The section stays highlighted on the pages under it (a review, an account, a create form).
const sidebarItems = computed(() => visibleItems.map(item => (typeof item.to === 'string'
  ? { ...item, active: isSectionActive(route.path, item.to, SECTION_PATHS[item.to]) }
  : item)))

// Ctrl/⌘+K or the sidebar's Search button: go to any page in the sidebar. Nuxt UI adds the
// light/dark commands.
const searchGroups: CommandPaletteGroup[] = [{
  id: 'pages',
  label: 'Go to',
  items: visibleItems
    .filter(item => item.type !== 'label')
    .map(item => ({ label: item.label, icon: item.icon as string | undefined, to: item.to })),
}]

// The signed-in staff member's menu, at the bottom of the sidebar.
const staffName = computed(() => staff.value?.username || staff.value?.email || 'Account')
const staffMenu = computed<DropdownMenuItem[][]>(() => [
  [{ label: staff.value?.email ?? staffName.value, type: 'label' }],
  [{ label: 'Log Out', icon: 'lucide:log-out', disabled: signOut.pending.value, onSelect: () => void signOut.submit() }],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      collapsible
      resizable
      :default-size="17"
      :max-size="24"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
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
  </UDashboardGroup>
</template>
