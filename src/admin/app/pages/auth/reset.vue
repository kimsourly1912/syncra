<script setup lang="ts">
import { ResetPasswordScreen } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })
useHead({ title: 'Set a new password' })
</script>

<template>
  <ResetPasswordScreen />
</template>
