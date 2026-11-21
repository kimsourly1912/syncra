<script lang="ts" setup>
import * as onboardingService from '@/services/onboarding.service'

const profileStore = useProfileStore()
const { toast } = useAppToast()
const {
  step,
  stepItems,
  ASYNC_DATA,
  companyProps,
  representativeProps,
} = useOnboarding()

const company = companyProps()
const representative = representativeProps()

const { execute: companyExecute, pending: companyPending } = useAsyncData(
  ASYNC_DATA.onboardingPage.company,
  () => onboardingService.createCompanyDetail(company.body.value),
  { immediate: false },
)

const { execute: representativeExecute, pending: representativePending } = useAsyncData(
  ASYNC_DATA.onboardingPage.representative,
  () => onboardingService.createRepresentative(representative.body.value),
  { immediate: false },
)

const onSubmitRepresentative = representative.submit(async () => {
  try {
    await representativeExecute()
    await profileStore.execute()
    toast.add('success', { title: 'Success', description: 'Submission Successfully' })
    step.value = 'company-details'
  }
  catch (e) {
    toast.addException(e)
  }
})

const onSubmitCompany = company.submit(async () => {
  try {
    await companyExecute()
    await profileStore.execute()
    navigateTo({ path: toRoute('/'), replace: true })
    toast.add('success', { title: 'Welcome', description: 'Good to see you 🌟' })
  }
  catch (e) {
    toast.addException(e)
  }
})
</script>

<template>
  <UPageCard class="flex-1">
    <header>
      <UButton
        icon="lucide:arrow-right"
        :to="toRoute('/')"
        label="I'll do this later"
        class="underline"
        color="info"
        variant="link"
      />
    </header>

    <section class="mt-10 max-w-4xl space-y-10 mx-auto w-full">
      <UStepper
        v-model="step"
        color="neutral"
        :items="stepItems"
        disabled
        orientation="horizontal"
        :ui="{ root: 'gap-10 w-full' }"
      >
        <template #representative-details>
          <FormRepresentativeDetail
            v-model:state="representative.data"
            :field-name="representative.FIELD_NAME"
            :loading="representativePending"
            @submit="onSubmitRepresentative"
          />
        </template>

        <template #company-details>
          <FormCompanyDetail
            v-model:state="company.data"
            :field-name="company.FIELD_NAME"
            :loading="companyPending"
            @submit="onSubmitCompany"
          />
        </template>
      </UStepper>
    </section>
  </UPageCard>
</template>
