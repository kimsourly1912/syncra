<script setup lang="ts">
useHead({
  titleTemplate: 'About Syncra - %s',
})
definePageMeta({
  layout: 'default',
})
const checkResolution = (e: Event) => {
  const img = e.target
  return img instanceof HTMLImageElement
}
</script>

<template>
  <LayoutDefault>
    <div class="">
      <section class="relative h-[220px] sm:h-[320px] md:h-[420px] rounded-xl overflow-hidden">
        <NuxtImg
          src="/img/about-img.jpg"
          alt="About Syncra"
          quality="100"
          class="absolute inset-0 h-full w-full object-fill"
          @load="checkResolution"
        />
      </section>
      <UCard class="mx-auto mt-8 space-y-6 rounded-2xl">
        <div class="flex flex-cols-1 *:md:flex-row items-center md:items-center mb-4  ">
          <h1 class="text-2xl md:text-3xl font-end font-bold text-highlighted">
            About Syncra
          </h1>
        </div>
        <p class="text-lg text-muted leading-relaxed">
          Syncra is a supply chain collaboration platform founded by industry veterans who have spent decades navigating the real-world complexities of global manufacturing.
          <br><br>
        </p>
        <p class="text-lg text-muted leading-relaxed">
          Our multidisciplinary team brings over 25 years of combined experience,
          including former merchandisers handling high-pressure collections, procurement specialists managing factory networks, production leaders running Asian operations, and experts in AI, IT, and data security. This unique mix of operational insight and advanced technology allows us to address the deep-rooted challenges of disconnected systems and eroded trust with genuine understanding.
          <br><br>
        </p>
        <p class="text-lg text-muted leading-relaxed">
          With a dedicated service network in China, Bangladesh, and Cambodia, we deliver responsive, localized support right where apparel and consumer goods production happens. At Syncra, we are driven to turn silos into shared success and fragmented chains into intelligent, collaborative ecosystems.
          <br><br>
        </p>
      </UCard>
    </div>
  </LayoutDefault>
</template>
