<script setup lang="ts">
import { ProductEditScreen } from '@/features/product'

useHead({ title: 'Edit product' })

const route = useRoute()
</script>

<template>
  <ProductEditScreen :id="String(route.params.id)" />
</template>
