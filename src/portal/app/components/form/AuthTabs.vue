<script setup lang="ts">
import type { IQueryValue } from '@/data/auth.data'

const { tabItems } = useAuth()
const model = defineModel<IQueryValue>({ default: 'email' })
</script>

<template>
  <UTabs
    v-model="model"
    :items="tabItems"
    size="sm"
    color="neutral"
    class="w-full"
    :ui="{ trigger: 'flex-1', list: tabItems.length <= 1 ? 'hidden' : '' }"
  >
    <template #email>
      <slot name="email" />
    </template>

    <template #phone>
      <slot name="phone" />
    </template>
  </UTabs>
</template>
