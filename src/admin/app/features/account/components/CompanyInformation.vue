<script setup lang="ts">
import { sampleAccount } from '../fixtures/account-detail'
import AccountDetailFields from './AccountDetailFields.vue'

const { company, representative } = sampleAccount
const sections = [
  {
    heading: 'Company details',
    icon: 'lucide:building-2',
    fields: [
      { label: 'Company name', value: company.name },
      { label: 'Company email', value: company.email },
      { label: 'Industry', value: company.industry },
      { label: 'Company size', value: company.size },
    ],
  },
  {
    heading: 'Representative details',
    icon: 'lucide:contact',
    fields: [
      { label: 'Full name', value: representative.name },
      { label: 'Role / position', value: representative.position },
      { label: 'Work email', value: representative.email },
      { label: 'Contact number', value: representative.phone },
    ],
  },
]
</script>

<template>
  <div class="grid gap-4 @min-[48rem]:grid-cols-[minmax(0,53fr)_minmax(0,47fr)]">
    <UCard
      v-for="section in sections"
      :key="section.heading"
      as="section"
      :aria-label="section.heading"
      :ui="{ header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'px-4 py-0 sm:px-5 sm:py-0' }"
    >
      <template #header>
        <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
          <UIcon
            :name="section.icon"
            class="size-5 text-primary"
          />
          {{ section.heading }}
        </h2>
      </template>

      <AccountDetailFields :fields="section.fields" />
    </UCard>
  </div>
</template>
