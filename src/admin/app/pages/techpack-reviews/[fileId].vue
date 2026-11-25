<script setup lang="ts">
import { ReviewDetailScreen } from '@/features/techpack-review'

// Key by path so another review starts with a fresh workspace.
definePageMeta({ key: route => route.path })

const route = useRoute()
const fileId = typeof route.params.fileId === 'string' ? route.params.fileId : ''
</script>

<template>
  <ReviewDetailScreen :file-id="fileId" />
</template>
