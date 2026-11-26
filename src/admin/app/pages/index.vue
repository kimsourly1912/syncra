<script setup lang="ts">
import { AccountListActions, AccountListScreen } from '@/features/account'

useHead({ title: 'Account Management' })
</script>

<template>
  <AccountListScreen>
    <template #actions>
      <AccountListActions />
    </template>
  </AccountListScreen>
</template>
