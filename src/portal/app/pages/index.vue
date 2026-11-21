<script lang="ts" setup>
import { ASYNC_DATA } from '@/constants/key'
import { findModules } from '@/services/module.service'
import * as moduleService from '@/services/module.service'
import * as onboardingService from '@/services/onboarding.service'
import type { UseOnboardingStepperType } from '@/composables/useOnboarding'
import WorkspaceCard from '@/features/workspace/components/WorkspaceCard.vue'
import type { CompleteProfileState } from '~/components/app/CompleteProfile.vue'
import type { WorkspaceCardItem } from '@/features/workspace/components/WorkspaceCard.vue'
import WorkspaceCardWrapper from '@/features/workspace/components/WorkspaceCardWrapper.vue'

const route = useRoute()
const { toast } = useAppToast()
const onboarding = useOnboarding()
const contactSale = useContactSale()
const profileStore = useProfileStore()

const { data: moduleAccessData, pending: moduleAccessPending } = useAsyncData(ASYNC_DATA.moduleAccess,
  async () => moduleService.getModulesAccess({ companyId: profileStore.companyId }),
  { lazy: true },
)

const { data, pending } = useAsyncData(ASYNC_DATA.module,
  () => findModules({ activeOnly: true }),
  { lazy: true },
)

const disabledInterestedProduct = shallowRef(false)
const completeProfileState = shallowRef<CompleteProfileState>('complete-profile')

const open = reactive({
  contactSale: false,
  completeProfile: false,
  successContactSale: false,
})

const company = onboarding.companyProps()
const representative = onboarding.representativeProps()

const { execute: companyExecute, pending: companyPending } = useAsyncData(
  onboarding.ASYNC_DATA.indexPage.company,
  () => onboardingService.createCompanyDetail(company.body.value),
  { immediate: false },
)

const { execute: representativeExecute, pending: representativePending } = useAsyncData(
  onboarding.ASYNC_DATA.indexPage.representative,
  () => onboardingService.createRepresentative(representative.body.value),
  { immediate: false },
)

const moduleItems = computed(() => {
  const codes = moduleAccessData.value?.data.map(o => o.moduleCode) ?? []
  const modules = data.value?.data ?? []
  return modules.filter(o => !codes.includes(o.code))
})

const workspaceItems = computed(() => {
  return moduleItems.value.map<WorkspaceCardItem>(o => ({
    id: o.id,
    title: o.name,
    code: o.code,
    img: o.iconUrl,
    value: `${o.id}`,
    desc: o.description,
  }))
})

const moduleAccessItems = computed(() => {
  if (!moduleAccessData.value?.data) return []
  return moduleAccessData.value.data.map<WorkspaceCardItem>(o => ({
    id: o.id,
    title: o.moduleName,
    img: o.moduleIconUrl,
    desc: o.moduleDescription,
    status: o.enabled ? 'ACTIVE' : 'INACTIVE',
  }))
})

const onSubmitRepresentative = representative.submit(async () => {
  try {
    await representativeExecute()
    await profileStore.execute()
    onboarding.step.value = 'company-details'
  }
  catch (e) {
    toast.addException(e)
  }
})

const onSubmitCompany = company.submit(async () => {
  try {
    await companyExecute()
    await profileStore.execute()
    completeProfileState.value = 'success'
  }
  catch (e) {
    toast.addException(e)
  }
})

const onSubmitContactSale = contactSale.submit(() => {
  open.contactSale = false
  open.successContactSale = true
})

function onboardingStep(): UseOnboardingStepperType {
  if (profileStore.data?.representCompleted) {
    return 'company-details'
  }
  return 'representative-details'
}

function openContact(type: string) {
  if (profileStore.onboarded) {
    open.completeProfile = false
    open.contactSale = true
    if (type === '') {
      contactSale.clearAll()
      disabledInterestedProduct.value = false
    }
    else {
      disabledInterestedProduct.value = true
      contactSale.data.helpWith = ''
      contactSale.data.interestedProduct = [type]
    }
    return
  }

  open.contactSale = false
  open.completeProfile = true
  company.clearAll()
  representative.clearAll()
  completeProfileState.value = 'complete-profile'
  onboarding.step.value = onboardingStep()
}

useHead({
  titleTemplate: 'Application - %s',
})

// Handle OAuth popup callback - close popup and redirect parent window
onMounted(() => {
  if (import.meta.client) {
    const isPopup = !!window.opener && !window.opener.closed
    const fromOAuth = route.query.auth === 'success' || route.query.code || route.query.state

    if (isPopup && fromOAuth) {
      try {
        const origin = window.location.origin
        window.opener.location.href = `${origin}/`
      }
      catch {
        // Cross-origin access may fail, but we still close the popup
      }
      window.close()
    }
  }
})
</script>

<template>
  <UDashboardPanel id="application">
    <template #header>
      <LayoutHeader title="Application" />
    </template>

    <template #body>
      <LayoutContent>
        <LayoutWrapper
          title="Your Applications"
          description="Quick access to your enabled Syncra modules"
        >
          <main>
            <template v-if="moduleAccessPending || moduleAccessItems.length > 0">
              <WorkspaceCardWrapper
                :pending-count="4"
                :pending="moduleAccessPending"
                :is-empty="moduleAccessItems.length === 0"
              >
                <WorkspaceCard :items="moduleAccessItems">
                  <template #footer="{ item, statusProps }">
                    <UButton
                      :color="statusProps.color"
                      block
                      :label="item.status === 'ACTIVE' ? 'Go to Workspace' : 'Contact Sale'"
                      :disabled="item.status === 'INACTIVE' ? true : false"
                      :to="toRoute('/workspace')"
                    />
                  </template>
                </WorkspaceCard>
              </WorkspaceCardWrapper>
            </template>

            <template v-else>
              <section
                class="mt-4 flex items-center justify-center p-4 sm:px-6 rounded-lg border-2 border-dashed border-accented bg-elevated/50 transition-all hover:bg-elevated"
              >
                <section class="flex flex-col gap-4 items-center text-center max-w-80">
                  <UBadge
                    icon="lucide:monitor"
                    color="neutral"
                    variant="subtle"
                    size="xl"
                    :ui="{
                      base: 'size-10 flex items-center justify-center rounded-full',
                    }"
                  />
                  <div class="space-y-1">
                    <BaseTypography
                      as="h1"
                      text="No Active Applications"
                      type="heading-1"
                    />

                    <BaseTypography
                      as="p"
                      text="You currently don't have any active Syncra modules. Contact our team to get started."
                      type="text"
                    />
                  </div>
                  <UButton
                    icon="lucide:arrow-right"
                    label="Contact Sales"
                    @click="openContact('')"
                  />
                </section>
              </section>
            </template>
          </main>
        </LayoutWrapper>

        <ShowIf
          subject="application-ads"
          action="read"
        >
          <LayoutWrapper
            title="Other Applications"
            description="Explore other features that would enhance your workflows."
          >
            <WorkspaceCardWrapper
              :pending
              :pending-count="8"
              :is-empty="workspaceItems.length === 0"
            >
              <WorkspaceCard
                :items="workspaceItems"
              >
                <template #footer="{ item }">
                  <section class="flex items-center gap-2">
                    <UButton
                      label="Contact Sales"
                      block
                      color="neutral"
                      @click="openContact(item.value)"
                    />
                    <UButton
                      block
                      label="Learn more"
                      color="neutral"
                      variant="outline"
                      :to="toRoute('/learn-more', `/${item.id}`)"
                    />
                  </section>
                </template>
              </WorkspaceCard>
            </WorkspaceCardWrapper>
          </LayoutWrapper>
        </ShowIf>
      </LayoutContent>

      <UModal
        v-model:open="open.contactSale"
        class="max-w-xl"
        scrollable
        :ui="{
          header: 'min-h-auto',
        }"
        title="Contact Sales"
        description="A member of our team will be in touch soon."
      >
        <template #body>
          <FormContactSale
            v-model:data="contactSale.data"
            :module-items
            :field-name="contactSale.FIELD_NAME"
            :loading="contactSale.pending.value || profileStore.pending"
            :disabled-interested-product="disabledInterestedProduct"
            @submit="onSubmitContactSale"
          />
        </template>
      </UModal>

      <ModalContent
        v-model="open.completeProfile"
        :class="completeProfileState === 'form' ? 'max-w-5xl' : 'max-w-xl'"
      >
        <template #default="{ close }">
          <CompleteProfile
            v-model:state="completeProfileState"
            :step="onboarding.step.value"
            @close="close"
            @contact="openContact('')"
          >
            <template #representative>
              <FormRepresentativeDetail
                v-model:state="representative.data"
                :loading="representativePending"
                :field-name="representative.FIELD_NAME"
                @submit="onSubmitRepresentative"
              />
            </template>
            <template #company>
              <FormCompanyDetail
                v-model:state="company.data"
                :field-name="company.FIELD_NAME"
                :loading="companyPending"
                @submit="onSubmitCompany"
              />
            </template>
          </CompleteProfile>
        </template>
      </ModalContent>

      <ModalSuccess
        v-model="open.successContactSale"
        title="Thank you for reach out to us!"
        description="Our team has received your request and will reach out to you shortly to discuss next steps."
      />
    </template>
  </UDashboardPanel>
</template>
