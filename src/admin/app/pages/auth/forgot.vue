<script setup lang="ts">
import { ForgotPasswordScreen } from '@/features/auth'

definePageMeta({ title: 'Reset your password', access: 'guest', layout: 'auth' })
</script>

<template>
  <ForgotPasswordScreen />
</template>
