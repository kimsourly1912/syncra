<script setup lang="ts">
import ReviewQueueScreen from '@/features/techpack-review/components/ReviewQueueScreen.vue'
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="TechPack reviews" />
    </template>

    <template #body>
      <ReviewQueueScreen />
    </template>
  </UDashboardPanel>
</template>
