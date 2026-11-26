<script setup lang="ts">
import { SignInScreen } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })
useHead({ title: 'Sign in' })
</script>

<template>
  <SignInScreen />
</template>
