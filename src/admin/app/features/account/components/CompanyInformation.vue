<script setup lang="ts">
import type { ListItem } from '@/types/components/list'

const representativeItems: ListItem[] = [
  {
    label: 'Full Name',
    value: 'John Doe',
    type: 'text',
  },
  {
    label: 'Work Email Address',
    value: 'John.doe@supplychain.com',
    type: 'text',
  },
  {
    label: 'Role / Position',
    value: 'Manager',
    type: 'text',
  },
  {
    label: 'Contact Number',
    value: '+855 12 345 678',
    type: 'text',
  },
]

const companyItems: ListItem[] = [
  {
    label: 'Company Name',
    value: 'Supply Chain Inc.',
    type: 'text',
  },
  {
    label: 'Company Email Address',
    value: 'SC@supplychain.com',
    type: 'text',
  },
  {
    label: 'Industry Type',
    value: 'Garment Industry',
    type: 'text',
  },
  {
    label: 'Company Size',
    value: '50 (Medium)',
    type: 'text',
  },
]
</script>

<template>
  <CardWrapper title="Representative Details">
    <ListWrapper>
      <ListItem :items="representativeItems" />
    </ListWrapper>
  </CardWrapper>

  <CardWrapper title="Company Details">
    <ListWrapper>
      <ListItem :items="companyItems" />
    </ListWrapper>
  </CardWrapper>
</template>
