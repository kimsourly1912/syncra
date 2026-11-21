<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSignOut } from '@/features/auth'

const signOut = useSignOut()
const router = useRouter()

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
        <UNavigationMenu
          :items="visibleItems"
          :collapsed
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : 'Log Out'"
          :aria-label="collapsed ? 'Log Out' : undefined"
          icon="lucide:log-out"
          color="neutral"
          variant="ghost"
          block
          :loading="signOut.pending.value"
          @click="signOut.submit"
        />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
