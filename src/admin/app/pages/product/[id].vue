<script setup lang="ts">
import { ProductEditScreen } from '@/features/product'

definePageMeta({ title: 'Edit product' })

const route = useRoute('product-id')
</script>

<template>
  <ProductEditScreen :id="route.params.id" />
</template>
