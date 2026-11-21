<script lang="ts" setup>
const { data, open, submit, pending } = useContactSale()
console.log(data.modules)

watch(() => open.contactSale, (val) => {
  if (val) {
    data.modules = ['']
  }
})
const onSubmit = submit()

useHead({
  titleTemplate: 'Welcome - %s',
})
</script>

<template>
  <LayoutDefault>
    <main class="max-w-3xl w-full mx-auto">
      <h1 class="sidebar text-4xl lg:text-6xl font-semibold text-center text-highlighted">
        AI DRIVEN SUPPLY CHAIN SOLUTIONS
      </h1>
      <p class="lg:text-lg text-muted mt-10 mb-8 text-center">
        Syncra is an AI-powered, end-to-end supply chain platform that delivers real-time transparency and maximum efficiency. It seamlessly connects brands, manufacturers, material suppliers, and customers—eliminating manual processes, integrating with existing APIs, and unlocking secure, auditable data insights. Every stakeholder gains visibility, trust, and value from one cost-effective solution.
      </p>

      <div class="flex items-center gap-4 justify-center aspect-video">
        <VideoPlayer />
      </div>

      <div class="flex gap-6 mt-10 justify-center flex-wrap">
        <UButton
          to="pricing"
          icon="lucide:arrow-right"
          color="neutral"
          variant="outline"
          size="xl"
          label="View Plan and Pricing"
        />
        <UButton
          icon="lucide:arrow-right"
          color="neutral"
          variant="outline"
          size="xl"
          label="Contact Sales"
          @click="open.contactSale = true"
        />
      </div>
    </main>

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
