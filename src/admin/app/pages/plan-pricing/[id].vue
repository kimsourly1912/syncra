<script setup lang="ts">
import { PlanEditScreen } from '@/features/plan-pricing'

useHead({ title: 'Edit plan' })

const route = useRoute()
</script>

<template>
  <PlanEditScreen :id="String(route.params.id)" />
</template>
