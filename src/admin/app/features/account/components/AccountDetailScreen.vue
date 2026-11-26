<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useAccountDetail } from '../composables/useAccountDetail'
import { ONBOARDING_BADGE, roleLabel } from '../utils/labels'
import CompanyInformation from './CompanyInformation.vue'
import ModuleManagement from './ModuleManagement.vue'
import SeatManagement from './SeatManagement.vue'
import TokenManagement from './TokenManagement.vue'

const props = defineProps<{
  /** From the route; undefined when the URL's id isn't a valid account id. */
  userId: number | undefined
}>()

const { data, loading, error, pending, refresh } = useAccountDetail(() => props.userId)
const overview = computed(() => data.value?.overview)
const company = computed(() => data.value?.companyInformation?.companyDetail)

const name = computed(() => overview.value?.username || overview.value?.email || `User #${props.userId}`)
const onboarding = computed(() => (overview.value?.onboardingStatus ? ONBOARDING_BADGE[overview.value.onboardingStatus] : undefined))
const role = computed(() => roleLabel(overview.value?.role))
const subtitle = computed(() => [company.value?.companyName, `User #${props.userId}`].filter(Boolean).join(' · '))
const facts = computed(() => [
  { label: 'Account email', value: overview.value?.email, icon: 'lucide:mail' },
  { label: 'Registered', value: formatDate(overview.value?.registeredDate), icon: 'lucide:calendar' },
  { label: 'Company ID', value: overview.value?.companyId == null ? undefined : `#${overview.value.companyId}`, icon: 'lucide:building-2' },
  { label: 'Country', value: company.value?.country, icon: 'lucide:map-pin' },
])

// The API has company information; modules, tokens, and seats have no read endpoint yet, so their
// tabs say Sample and show sample data (open question).
const SAMPLE = { label: 'Sample', color: 'neutral', variant: 'outline', size: 'sm' } as const
const tabs = [
  { label: 'Company', value: 'company-information', icon: 'lucide:building-2' },
  { label: 'Modules', value: 'module', icon: 'lucide:blocks', badge: SAMPLE },
  { label: 'Tokens', value: 'token', icon: 'lucide:coins', badge: SAMPLE },
  { label: 'Seats', value: 'seat', icon: 'lucide:users', badge: SAMPLE },
] as const satisfies (TabsItem & { value: string })[]

const selectedTab = useUrlTab(tabs.map(tab => tab.value))
const notFound = computed(() => props.userId === undefined || error.value?.kind === 'not_found')
</script>

<template>
  <UDashboardPanel :ui="{ body: 'bg-elevated/50' }">
    <template #header>
      <UDashboardNavbar
        title="Account detail"
        :toggle="false"
      >
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
      </UDashboardNavbar>
    </template>

    <template #body>
      <UEmpty
        v-if="notFound"
        icon="lucide:user-x"
        title="Account not found"
        description="It may have been removed, or the link is wrong."
        :actions="[{ label: 'Back to accounts', icon: 'lucide:arrow-left', to: '/', color: 'neutral', variant: 'outline' }]"
      />

      <div
        v-else
        class="@container min-w-0 space-y-4"
      >
        <AlertApiError
          v-if="error"
          :error="error"
          title="Could not load this account"
          :retrying="pending"
          @retry="refresh"
        />

        <!-- Who the account is: name and badges, then the key facts in a grid that reflows. -->
        <UCard
          v-else
          as="section"
          aria-label="Account summary"
          :ui="{ body: 'p-4 sm:p-5' }"
        >
          <div class="flex min-w-0 items-start gap-3 sm:gap-4">
            <USkeleton
              v-if="loading"
              class="size-12 shrink-0 rounded-full"
            />
            <UAvatar
              v-else
              :alt="name"
              size="xl"
              class="shrink-0 bg-primary/10 text-primary"
            />
            <div class="min-w-0 flex-1 space-y-1.5">
              <template v-if="loading">
                <USkeleton class="h-6 w-48" />
                <USkeleton class="h-4 w-64 max-w-full" />
              </template>
              <template v-else>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h2 class="text-lg font-semibold wrap-anywhere text-highlighted sm:text-xl">
                    {{ name }}
                  </h2>
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge
                      v-if="role"
                      :label="role"
                      color="neutral"
                      variant="subtle"
                    />
                    <UBadge
                      v-if="onboarding"
                      :label="onboarding.label"
                      :color="onboarding.color"
                      variant="subtle"
                    />
                  </div>
                </div>
                <p class="text-sm wrap-anywhere text-muted">
                  {{ subtitle }}
                </p>
              </template>
            </div>
          </div>

          <!-- 1 column on a phone, 2 from 30rem, 4 from 56rem. -->
          <dl class="mt-4 grid gap-x-6 gap-y-3 border-t border-default pt-4 @min-[30rem]:grid-cols-2 @min-[56rem]:grid-cols-4">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="flex min-w-0 items-start gap-2.5"
            >
              <UIcon
                :name="fact.icon"
                class="mt-0.5 size-4 shrink-0 text-muted"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <dt class="text-xs text-muted">
                  {{ fact.label }}
                </dt>
                <dd class="text-sm font-medium wrap-anywhere text-highlighted">
                  <USkeleton
                    v-if="loading"
                    class="mt-1 h-4 w-28"
                  />
                  <template v-else>
                    {{ fact.value || NO_VALUE }}
                  </template>
                </dd>
              </div>
            </div>
          </dl>
        </UCard>

        <UDashboardToolbar :ui="{ root: 'px-0 sm:px-0', left: 'min-w-0' }">
          <ListToolbarTabs
            v-model="selectedTab"
            :items="[...tabs]"
            role="group"
            aria-label="Account sections"
          />
        </UDashboardToolbar>

        <UAlert
          v-if="selectedTab !== 'company-information'"
          icon="lucide:flask-conical"
          color="neutral"
          variant="subtle"
          title="Sample data"
          description="This tab isn't connected to the API yet, so it shows example figures and its actions are off."
        />

        <CompanyInformation
          v-if="selectedTab === 'company-information'"
          :information="data?.companyInformation ?? undefined"
          :loading
        />
        <ModuleManagement v-else-if="selectedTab === 'module'" />
        <TokenManagement v-else-if="selectedTab === 'token'" />
        <SeatManagement v-else-if="selectedTab === 'seat'" />
      </div>
    </template>
  </UDashboardPanel>
</template>
