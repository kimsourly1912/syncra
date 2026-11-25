<script setup lang="ts">
import { findSamplePlan, PlanFormScreen } from '@/features/plan-pricing'

// Sample data until the plan API exists: an id that isn't a sample plan shows Not found.
const route = useRoute()
const plan = computed(() => findSamplePlan(String(route.params.id)))
</script>

<template>
  <PlanFormScreen
    v-if="plan"
    :key="plan.id"
    :plan
  />
  <UDashboardPanel
    v-else
    class="page-narrow"
  >
    <template #header>
      <UDashboardNavbar
        title="Plan not found"
        :toggle="false"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/plan-pricing"
            aria-label="Back to plans"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UEmpty
        icon="lucide:tag"
        title="Plan not found"
        description="It may have been removed, or the link is wrong."
        :actions="[{ label: 'Back to plans', icon: 'lucide:arrow-left', to: '/plan-pricing', color: 'neutral', variant: 'outline' }]"
      />
    </template>
  </UDashboardPanel>
</template>
