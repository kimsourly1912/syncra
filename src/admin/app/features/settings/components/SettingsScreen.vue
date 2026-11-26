<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import EmailTemplateSettings from './EmailTemplateSettings.vue'
import ProfileSettings from './ProfileSettings.vue'
import StaffAccessSettings from './StaffAccessSettings.vue'
import TokenPackageSettings from './TokenPackageSettings.vue'

const tabs = [
  { label: 'Profile', value: 'profile', icon: 'lucide:circle-user' },
  { label: 'Staff access', value: 'staff', icon: 'lucide:shield-check' },
  { label: 'Email templates', value: 'email-templates', icon: 'lucide:mail' },
  { label: 'Token packages', value: 'token-packages', icon: 'lucide:coins' },
] as const satisfies (TabsItem & { value: string })[]

// The section is `?tab=`, so reload and shared links open it.
const tab = useUrlTab(tabs.map(item => item.value))
</script>

<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar
        icon="lucide:settings"
        title="Settings"
      />
      <UDashboardToolbar>
        <template #left>
          <ListToolbarTabs
            v-model="tab"
            :items="[...tabs]"
            role="group"
            aria-label="Settings sections"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <ProfileSettings v-if="tab === 'profile'" />
      <StaffAccessSettings v-else-if="tab === 'staff'" />
      <EmailTemplateSettings v-else-if="tab === 'email-templates'" />
      <TokenPackageSettings v-else-if="tab === 'token-packages'" />
    </template>
  </UDashboardPanel>
</template>
