<script setup lang="ts">
import { AccountDetailScreen } from '@/features/account'

// `/account/42`: anything that isn't a positive whole number shows "Account not found".
const route = useRoute()
const userId = computed(() => {
  const id = Number(route.params.id)
  return Number.isInteger(id) && id > 0 ? id : undefined
})
</script>

<template>
  <AccountDetailScreen :user-id="userId" />
</template>
