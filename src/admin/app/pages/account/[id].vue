<script setup lang="ts">
import { tabTheme } from '@/theme/tab'
import type { TabsItem } from '@nuxt/ui'
import type { ListItem } from '@/types/components/list'
import SeatManagement from '@/features/account/components/SeatManagement.vue'
import TokenManagement from '@/features/account/components/TokenManagement.vue'
import ModuleManagement from '@/features/account/components/ModuleManagement.vue'
import CompanyInformation from '@/features/account/components/CompanyInformation.vue'

const tabItems = [
  {
    label: 'Company Information',
    value: 'company-information',
    slot: 'company-information' as const,
  },
  {
    label: 'Module',
    value: 'module',
    slot: 'module' as const,
  },
  {
    label: 'Token',
    value: 'token',
    slot: 'token' as const,
  },
  {
    label: 'Seat',
    value: 'seat',
    slot: 'seat' as const,
  },
] satisfies TabsItem[]

const route = useRoute()
const selectedTab = shallowRef((route.query.tab as string) ?? tabItems[0]!.value)

const accountItems: ListItem[] = [
  {
    label: 'Username',
    value: 'John Doe',
    type: 'text',
  },
  {
    label: 'Onboarding Status',
    value: 'Completed',
    type: 'badge',
  },
  {
    label: 'Email',
    value: 'Suci@gmail.com',
    type: 'text',
  },
  {
    label: 'Role',
    value: 'Company Admin',
    type: 'text',
  },
  {
    label: 'Register Date',
    value: 'Dec 15,2025',
    type: 'text',
  },
]

watch(selectedTab, (tab) => {
  navigateTo({ query: {
    tab,
  } })
}, { immediate: true })
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Account Detail"
        to="/"
      />

      <CardWrapper title="Account Overview">
        <ListWrapper>
          <ListItem :items="accountItems" />
        </ListWrapper>
      </CardWrapper>

      <UTabs
        v-model="selectedTab"
        :items="tabItems"
        variant="link"
        :ui="tabTheme"
      >
        <template #company-information>
          <CompanyInformation />
        </template>

        <template #module>
          <ModuleManagement />
        </template>

        <template #token>
          <TokenManagement />
        </template>

        <template #seat>
          <SeatManagement />
        </template>
      </UTabs>
    </LayoutContent>
  </div>
</template>
