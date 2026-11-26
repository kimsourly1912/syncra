<script setup lang="ts">
import { PlanEditScreen } from '@/features/plan-pricing'

definePageMeta({ title: 'Edit plan' })

const route = useRoute('plan-pricing-id')
</script>

<template>
  <PlanEditScreen :id="route.params.id" />
</template>
