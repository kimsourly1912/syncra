<script setup lang="ts">
import { findSampleProduct } from '../fixtures/products'
import ProductFormScreen from './ProductFormScreen.vue'

/**
 * Edit product at `/product/<id>`, or "Product not found". Sample data until the product API
 * exists: an id that isn't a sample product shows Not found. Wiring it replaces the lookup with a
 * query (docs/crud-recipe.md).
 */
const props = defineProps<{
  id: string
}>()

const product = computed(() => findSampleProduct(props.id))
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
