<script setup lang="ts">
import { ForgotPasswordScreen } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })
useHead({ title: 'Reset your password' })
</script>

<template>
  <ForgotPasswordScreen />
</template>
