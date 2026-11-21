<script setup lang="ts">
const { data, submit, open, pending } = useContactSale()

data.modules = ['']
const onSubmit = submit()

useHead({
  titleTemplate: 'Learn More - %s',
})
</script>

<template>
  <LayoutDefault>
    <div class="min-h-[60vh] flex flex-col items-center justify-center">
      <div class="text-center max-w-2xl mx-auto px-4">
        <div class="mb-8">
          <UIcon
            name="lucide:construction"
            class="size-20 text-muted"
          />
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-highlighted mb-4">
          Coming Soon
        </h1>
        <p class="text-lg text-muted mb-8">
          We're working hard to bring you detailed information about this product.
          Check back soon for updates!
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="outline"
            size="xl"
            label="Back to Products"
            to="/products"
          />
          <UButton
            icon="lucide:mail"
            color="neutral"
            variant="solid"
            size="xl"
            label="Contact Sales"
            @click="open.contactSale = true"
          />
        </div>
      </div>
    </div>

    <ModalContactSale v-model="open.contactSale">
      <FormContactSale
        v-model:data="data"
        :pending
        @submit="onSubmit"
      />
    </ModalContactSale>
    <ModalSuccess v-model="open.success" />
  </LayoutDefault>
</template>
