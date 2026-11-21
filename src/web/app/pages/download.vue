<script lang="ts" setup>
useHead({
  titleTemplate: 'Download - %s',
})
</script>

<template>
  <LayoutDefault>
    <div>
      <main class="UContainer flex flex-col items-center text-center">
        <section class="flex items-center max-md:flex-col gap-20">
          <section class="grow-0 shrink-0 md:basis-80">
            <NuxtImg
              class="max-md:max-h-96"
              src="/img/originals/syncra-phone-mock.png"
              :format="'avif'"
              quality="100"
            />
          </section>

          <section class="space-y-10 flex-1">
            <h1 class="text-3xl sm:text-4xl md:text-6xl xl:text-8xl font-semibold text-[#767475]">
              APP is
            </h1>
            <h1 class="text-3xl sm:text-4xl md:text-6xl xl:text-8xl font-semibold text-[#767475]">
              coming soon!
            </h1>
          <!-- <header>
            <h1 class="text-highlighted font-semibold text-2xl">
              Mobile Application
            </h1>
            <p class="text-muted text-lg mt-2">
              Download Syncra today — and let it assist
              your work effortlessly.
            </p>
          </header>

          <section class="flex gap-4 flex-wrap">
            <button class="py-1.5 px-5 rounded-lg flex items-center gap-2 bg-inverted text-inverted cursor-pointer">
              <UIcon
                name="logo:apple"
                class="size-8"
              />
              <div class="inline-flex flex-col items-start text-sm">
                <span>Download on the </span>
                <span class="font-semibold">AppStore</span>
              </div>
            </button>

            <button class="py-1.5 px-5 rounded-lg flex items-center gap-2 bg-inverted text-inverted cursor-pointer">
              <UIcon
                name="logo:google-play-colorful"
                class="size-8"
              />
              <div class="inline-flex flex-col items-start text-sm">
                <span>Get it on </span>
                <span class="font-semibold">Google Playstore</span>
              </div>
            </button>
          </section> -->
          </section>
        </section>
      </main>
    </div>
  </LayoutDefault>
</template>
