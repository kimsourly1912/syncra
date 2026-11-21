<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const reqToken = useRequestToken()
const profileStore = useProfileStore()
const applicationStore = useApplicationStore()

const profileInfo = computed(() => {
  if (!profileStore.data) return
  const { firstName, lastName, email, companyDetail, representative, logoUrl } = profileStore.data
  const shouldDisplayName = [firstName, lastName].every(o => o?.length > 0 && o !== ' ')
  return {
    profile: logoUrl,
    companyName: companyDetail.companyName,
    position: representative.rolePosition,
    name: shouldDisplayName ? `${firstName} ${lastName}` : email,
  }
})

const menuItems = computed<NavigationMenuItem[]>(() => {
  return [
    {
      label: 'Application',
      icon: 'lucide:monitor',
      to: toRoute('/'),
      type: 'link',
    },
    profileStore.isAdmin && {
      label: 'Team Management',
      icon: 'lucide:users',
      to: toRoute('/team-management'),
      type: 'link',
    },
    profileStore.isAdmin && {
      label: 'Activity',
      icon: 'lucide:file-text',
      to: toRoute('/activity-log'),
      type: 'link',
    },
    {
      label: 'Settings',
      icon: 'lucide:settings',
      to: toRoute('/settings'),
      type: 'link',
    },
  ].filter(Boolean) as NavigationMenuItem[]
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="admin-sidebar"
      v-model:collapsed="applicationStore.collapsed.sidebar"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{
        body: tw`p-0 sm:p-0 gap-2`,
        header: tw`border-b border-default`,
      }"
    >
      <template #header="{ collapsed }">
        <template v-if="collapsed">
          <NuxtLink :to="toRoute('/')">
            <NuxtImg src="/img/syncra-logo.png" />
          </NuxtLink>
        </template>
        <template v-else>
          <section class="flex items-center gap-4 justify-between flex-1">
            <NuxtLink
              :to="toRoute('/')"
              class="font-semibold flex items-center gap-2 text-xl"
            >
              <NuxtImg
                class="w-8"
                src="/img/syncra-logo.png"
              />
              Syncra
            </NuxtLink>
            <UDashboardSidebarCollapse />
          </section>
        </template>
      </template>

      <template #default="{ collapsed }">
        <section class="flex items-center gap-2 px-4 py-2 border-b border-default">
          <NuxtLink
            :to="toRoute('/settings/account-profile')"
          >
            <UAvatar :src="profileInfo?.profile ?? ''" />
          </NuxtLink>
          <section v-if="!collapsed">
            <NuxtLink
              :to="toRoute('/settings/account-profile')"
              class="text-highlighted text-sm font-medium line-clamp-1 break-all hover:underline"
            >
              {{ profileInfo?.name ?? '' }}
            </NuxtLink>

            <p class="text-muted text-xs line-clamp-1">
              <span>{{ profileInfo?.position }}</span> • <NuxtLink
                :to="toRoute('/settings/company-information')"
                class="hover:underline"
              >
                <span>{{ profileInfo?.companyName ?? '' }}</span>
              </NuxtLink>
            </p>
          </section>
        </section>

        <main :class="['px-2 flex flex-col gap-2', collapsed ? 'items-center' : '']">
          <template v-if="collapsed">
            <UDashboardSidebarCollapse />
          </template>

          <UNavigationMenu
            :collapsed="collapsed"
            :items="menuItems"
            orientation="vertical"
            tooltip
            popover
          />

          <section class="lg:hidden">
            <TokenBalanceBadge />
          </section>
        </main>
      </template>

      <template #footer="{ collapsed }">
        <UButton
          :label="collapsed ? '' : 'Logout'"
          icon="lucide:log-out"
          variant="ghost"
          color="neutral"
          class="w-full justify-center"
          :loading="profileStore.pendingLogout"
          @click="profileStore.onLogout()"
        />
      </template>
    </UDashboardSidebar>

    <slot />

    <LazyUModal
      v-model:open="reqToken.open.value.request"
      class="max-w-xl"
      title="Contact Sale"
      description="A member of our team will be in touch soon."
    >
      <template #body>
        <LazyFormContactSaleForToken
          v-model:data="reqToken.state"
          :pending="reqToken.loading.value"
          @submit="reqToken.onSubmit"
        />
      </template>
    </LazyUModal>

    <LazyModalSuccess
      v-model="reqToken.open.value.success"
      title="Thank you for reach out to us!"
      description="Our team has received your request and will reach out to you shortly to discuss next steps."
    />
  </UDashboardGroup>
</template>
