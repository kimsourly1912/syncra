<script setup lang="ts">
import { AccountListActions, AccountListScreen } from '@/features/account'
</script>

<template>
  <AccountListScreen>
    <template #actions>
      <AccountListActions />
    </template>
  </AccountListScreen>
</template>
