<script setup lang="ts">
import { findSampleProduct, ProductFormScreen } from '@/features/product'

// Sample data until the product API exists: an id that isn't a sample product shows Not found.
const route = useRoute()
const product = computed(() => findSampleProduct(String(route.params.id)))
</script>

<template>
  <ProductFormScreen
    v-if="product"
    :key="product.id"
    :product
  />
  <UDashboardPanel
    v-else
    class="page-narrow"
  >
    <template #header>
      <UDashboardNavbar
        title="Product not found"
        :toggle="false"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/product"
            aria-label="Back to products"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UEmpty
        icon="lucide:package-x"
        title="Product not found"
        description="It may have been removed, or the link is wrong."
        :actions="[{ label: 'Back to products', icon: 'lucide:arrow-left', to: '/product', color: 'neutral', variant: 'outline' }]"
      />
    </template>
  </UDashboardPanel>
</template>
