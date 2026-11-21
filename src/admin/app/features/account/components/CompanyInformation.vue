<script setup lang="ts">
import type { ListDetail } from '@/components/list/ListDetails.vue'

const representativeItems: ListDetail[] = [
  {
    label: 'Full Name',
    value: 'John Doe',
  },
  {
    label: 'Work Email Address',
    value: 'John.doe@supplychain.com',
  },
  {
    label: 'Role / Position',
    value: 'Manager',
  },
  {
    label: 'Contact Number',
    value: '+855 12 345 678',
  },
]

const companyItems: ListDetail[] = [
  {
    label: 'Company Name',
    value: 'Supply Chain Inc.',
  },
  {
    label: 'Company Email Address',
    value: 'SC@supplychain.com',
  },
  {
    label: 'Industry Type',
    value: 'Garment Industry',
  },
  {
    label: 'Company Size',
    value: '50 (Medium)',
  },
]
</script>

<template>
  <UPageCard
    title="Representative Details"
    variant="outline"
  >
    <ListDetails :items="representativeItems" />
  </UPageCard>

  <UPageCard
    title="Company Details"
    variant="outline"
  >
    <ListDetails :items="companyItems" />
  </UPageCard>
</template>
