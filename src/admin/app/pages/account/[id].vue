<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ListDetail } from '@/components/list/ListDetails.vue'
import { CompanyInformation, ModuleManagement, SeatManagement, TokenManagement } from '@/features/account'

const tabItems = [
  {
    label: 'Company Information',
    value: 'company-information',
  },
  {
    label: 'Module',
    value: 'module',
  },
  {
    label: 'Token',
    value: 'token',
  },
  {
    label: 'Seat',
    value: 'seat',
  },
] as const satisfies TabsItem[]

// The tab is in `?tab=`; switching replaces the URL, so Back leaves the page.
const selectedTab = useUrlTab(tabItems.map(item => item.value))

const accountItems: ListDetail[] = [
  {
    label: 'Username',
    value: 'John Doe',
  },
  {
    label: 'Onboarding Status',
    value: 'Completed',
    type: 'badge',
  },
  {
    label: 'Email',
    value: 'Suci@gmail.com',
  },
  {
    label: 'Role',
    value: 'Company Admin',
  },
  {
    label: 'Register Date',
    value: 'Dec 15,2025',
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:building-2"
        title="Account Detail"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/"
            aria-label="Back to accounts"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UTabs
          v-model="selectedTab"
          :items="tabItems"
          :content="false"
          variant="link"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageCard
        title="Account Overview"
        variant="outline"
      >
        <ListDetails :items="accountItems" />
      </UPageCard>

      <CompanyInformation v-if="selectedTab === 'company-information'" />
      <ModuleManagement v-else-if="selectedTab === 'module'" />
      <TokenManagement v-else-if="selectedTab === 'token'" />
      <SeatManagement v-else-if="selectedTab === 'seat'" />
    </template>
  </UDashboardPanel>
</template>
