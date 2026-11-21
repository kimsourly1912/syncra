<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSignOut } from '@/features/auth'

const { preference } = useStorage()

const signOut = useSignOut()

const menuItems: NavigationMenuItem[] = [
  {
    label: 'Customer Portal',
    type: 'label',
  },
  {
    label: 'Account Management',
    type: 'link',
    to: '/',
  },
  {
    label: 'TechPack Reviews',
    type: 'link',
    to: '/techpack-reviews',
  },
  {
    label: 'Sale Request',
    type: 'link',
    to: '/sale-request',
  },
  {
    label: 'Website Management',
    type: 'label',
  },
  {
    label: 'Lead Inquiry',
    type: 'link',
    to: '/lead-inquiry',
  },
  {
    label: 'HeroPage Management',
    type: 'link',
    to: '/hero',
  },
  {
    label: 'Product Management',
    type: 'link',
    to: '/product',
  },
  {
    label: 'Plan & Pricing Management',
    type: 'link',
    to: '/plan-pricing',
  },
  {
    label: 'Community Management',
    type: 'link',
    to: '/community',
  },
  {
    label: 'System',
    type: 'label',
  },
  {
    label: 'Setting',
    type: 'link',
    to: '/setting',
  },
]

const toggle = reactive({
  menu: false,
})
</script>

<template>
  <main>
    <header class="border-b border-default flex items-center py-2 px-4 bg-white z-50 min-h-16">
      <section class="flex items-center gap-2">
        <UButton
          size="md"
          variant="ghost"
          color="neutral"
          :icon="preference.sidebar ? 'lucide:panel-right-close' : 'lucide:panel-left-close'"
          class="max-xl:hidden"
          @click="preference.sidebar = !preference.sidebar"
        />

        <UButton
          size="md"
          variant="ghost"
          color="neutral"
          icon="lucide:menu"
          class="xl:hidden"
          @click="toggle.menu = !toggle.menu"
        />

        <NuxtLink
          to="/"
          class="flex items-center gap-3 text-2xl font-semibold"
        >
          <img
            src="/img/syncra-logo.png"
            class="max-w-8"
          >
          Syncra
        </NuxtLink>
      </section>
    </header>

    <main class="flex">
      <aside
        :class="[
          'h-[calc(100svh-var(--spacing)*16)] bg-secondary-100 py-4 w-64 max-xl:hidden flex-col overflow-y-auto',
          preference.sidebar ? 'hidden' : 'flex',
        ]"
      >
        <LayoutNavMenu
          :items="menuItems"
          :signing-out="signOut.pending.value"
          @sign-out="signOut.submit"
        />
      </aside>

      <section class="h-[calc(100svh-var(--spacing)*16)] bg-[#F8F9FA] flex-1 px-4 pt-4 pb-10 md:px-6 md:pt-6 md:pb-14 overflow-y-auto">
        <slot />
      </section>
    </main>

    <UDrawer
      v-model:open="toggle.menu"
      direction="left"
      title="Menu"
      :handle-only="false"
      :handle="false"
      :close-threshold="0"
      :active-snap-point="null"
    >
      <template #title />
      <template #description />
      <template #content>
        <main class="w-64 flex flex-col">
          <header class="flex items-center gap-2 py-4 px-2">
            <UButton
              size="md"
              variant="ghost"
              color="neutral"
              icon="lucide:menu"
              @click="toggle.menu = !toggle.menu"
            />
            <NuxtLink
              to="/"
              class="flex items-center gap-3 text-2xl font-semibold"
              @click="toggle.menu = false"
            >
              <img
                src="/img/syncra-logo.png"
                class="max-w-8"
              >
              Syncra
            </NuxtLink>
          </header>
          <LayoutNavMenu
            :items="menuItems"
            :signing-out="signOut.pending.value"
            @navigate="toggle.menu = false"
            @sign-out="signOut.submit"
          />
        </main>
      </template>
    </UDrawer>
  </main>
</template>
