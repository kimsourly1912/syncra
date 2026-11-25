<script setup lang="ts">
import type { AccountDetail } from '../models/account-detail'
import AccountDetailFields from './AccountDetailFields.vue'

const props = defineProps<{
  information: NonNullable<AccountDetail['companyInformation']> | undefined
  loading?: boolean
}>()

const sections = computed(() => {
  const company = props.information?.companyDetail
  const person = props.information?.representative
  return [
    {
      heading: 'Company details',
      icon: 'lucide:building-2',
      fields: [
        { label: 'Company name', value: company?.companyName },
        { label: 'Company email', value: company?.companyEmail },
        { label: 'Phone', value: company?.phoneNumber },
        { label: 'Industry', value: company?.industryType },
        { label: 'Company size', value: company?.companySize },
        { label: 'Country', value: company?.country },
      ],
    },
    {
      heading: 'Representative',
      icon: 'lucide:contact',
      fields: [
        { label: 'Full name', value: person?.fullName },
        { label: 'Role / position', value: person?.position },
        { label: 'Work email', value: person?.workEmail },
        { label: 'Contact number', value: person?.contactNumber },
      ],
    },
  ]
})
</script>

<template>
  <!-- Side by side from a 48rem panel; stacked below. -->
  <div class="grid gap-4 @min-[48rem]:grid-cols-[minmax(0,53fr)_minmax(0,47fr)] @min-[48rem]:items-start">
    <UCard
      v-for="section in sections"
      :key="section.heading"
      as="section"
      :aria-label="section.heading"
      :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'px-4 py-0 sm:px-5 sm:py-0' }"
    >
      <template #header>
        <h2 class="flex items-center gap-2 font-semibold text-highlighted sm:text-lg">
          <UIcon
            :name="section.icon"
            class="size-5 text-primary"
          />
          {{ section.heading }}
        </h2>
      </template>

      <AccountDetailFields
        :fields="section.fields"
        :loading
      />
    </UCard>
  </div>
</template>
