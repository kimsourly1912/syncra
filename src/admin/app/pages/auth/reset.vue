<script setup lang="ts">
import { ResetPasswordScreen } from '@/features/auth'

definePageMeta({ title: 'Set a new password', access: 'guest', layout: 'auth' })
</script>

<template>
  <ResetPasswordScreen />
</template>
