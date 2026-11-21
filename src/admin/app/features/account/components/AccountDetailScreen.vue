<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { sampleAccount } from '../fixtures/account-detail'
import CompanyInformation from './CompanyInformation.vue'
import ModuleManagement from './ModuleManagement.vue'
import SeatManagement from './SeatManagement.vue'
import TokenManagement from './TokenManagement.vue'

const tabs = [
  { label: 'Company information', value: 'company-information' },
  { label: 'Modules', value: 'module' },
  { label: 'Tokens', value: 'token' },
  { label: 'Seats', value: 'seat' },
] as const satisfies TabsItem[]

const selectedTab = useUrlTab(tabs.map(tab => tab.value))
</script>

<template>
  <UDashboardPanel :ui="{ body: 'bg-elevated/50' }">
    <template #header>
      <UDashboardNavbar title="Account detail">
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/"
            aria-label="Back to accounts"
          >
            <span class="hidden sm:inline">Back to accounts</span>
          </UButton>
          <USeparator
            orientation="vertical"
            class="mx-1 hidden h-5 sm:block"
          />
        </template>

        <template #right>
          <UBadge
            label="Sample data"
            color="neutral"
            variant="subtle"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="@container min-w-0 space-y-4">
        <UCard
          as="section"
          aria-label="Account summary"
          :ui="{ body: 'p-4 sm:p-5' }"
        >
          <div class="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3 @min-[61rem]:grid @min-[61rem]:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_auto]">
            <div class="flex min-w-0 flex-1 basis-56 items-center gap-3">
              <UAvatar
                :alt="sampleAccount.name"
                size="lg"
                class="shrink-0 bg-primary/10 text-primary"
              />
              <div class="min-w-0">
                <h2 class="text-xl font-semibold wrap-anywhere text-highlighted">
                  {{ sampleAccount.name }}
                </h2>
                <p class="text-sm wrap-anywhere text-muted">
                  {{ sampleAccount.company.name }} · User #{{ sampleAccount.userId }}
                </p>
              </div>
            </div>

            <dl class="order-last grid w-full min-w-0 gap-x-6 gap-y-2 text-sm @min-[32rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] @min-[61rem]:order-0 @min-[61rem]:w-auto">
              <div class="min-w-0 @min-[61rem]:border-s @min-[61rem]:border-default @min-[61rem]:ps-6">
                <dt class="text-muted">
                  Account email
                </dt>
                <dd class="font-medium wrap-anywhere text-highlighted">
                  {{ sampleAccount.email }}
                </dd>
              </div>
              <div class="min-w-0 @min-[61rem]:border-s @min-[61rem]:border-default @min-[61rem]:ps-6">
                <dt class="text-muted">
                  Registered
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ sampleAccount.registered }}
                </dd>
              </div>
            </dl>

            <div class="flex flex-wrap gap-1.5 @min-[61rem]:flex-col @min-[61rem]:items-start @min-[61rem]:border-s @min-[61rem]:border-default @min-[61rem]:ps-6">
              <UBadge
                :label="sampleAccount.role"
                color="neutral"
                variant="subtle"
              />
              <UBadge
                label="Onboarding complete"
                color="success"
                variant="subtle"
              />
            </div>
          </div>
        </UCard>

        <UDashboardToolbar :ui="{ root: 'px-0 sm:px-0', left: 'min-w-0' }">
          <ListToolbarTabs
            v-model="selectedTab"
            :items="tabs"
            aria-label="Account detail tabs"
          />
        </UDashboardToolbar>

        <CompanyInformation v-if="selectedTab === 'company-information'" />
        <ModuleManagement v-else-if="selectedTab === 'module'" />
        <TokenManagement v-else-if="selectedTab === 'token'" />
        <SeatManagement v-else-if="selectedTab === 'seat'" />
      </div>
    </template>
  </UDashboardPanel>
</template>
