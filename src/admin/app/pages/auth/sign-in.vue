<script setup lang="ts">
import { SignInScreen } from '@/features/auth'

definePageMeta({ title: 'Sign in', access: 'guest', layout: 'auth' })
</script>

<template>
  <SignInScreen />
</template>
