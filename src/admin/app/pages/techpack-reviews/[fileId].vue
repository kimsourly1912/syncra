<script setup lang="ts">
import ReviewDetailScreen from '@/features/techpack-review/components/ReviewDetailScreen.vue'

// Keyed by path, so opening another review remounts the screen with fresh state.
definePageMeta({ key: route => route.path })

const route = useRoute()
const fileId = typeof route.params.fileId === 'string' ? route.params.fileId : ''
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:file-search"
        title="TechPack review"
      />
    </template>

    <template #body>
      <ReviewDetailScreen :file-id="fileId" />
    </template>
  </UDashboardPanel>
</template>
