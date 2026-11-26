<script setup lang="ts">
import { AccountListActions, AccountListScreen } from '@/features/account'

definePageMeta({ title: 'Account management' })
</script>

<template>
  <AccountListScreen>
    <template #actions>
      <AccountListActions />
    </template>
  </AccountListScreen>
</template>
