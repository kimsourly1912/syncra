<script setup lang="ts">
import ReviewQueueScreen from '@/features/techpack-review/components/ReviewQueueScreen.vue'

definePageMeta({ middleware: 'auth' })
</script>

<template>
  <ReviewQueueScreen />
</template>
