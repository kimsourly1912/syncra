<script setup lang="ts">
</script>

<template>
  <div>
    <main class="min-h-screen flex flex-col">
      <UContainer class="py-10 flex-1 flex items-center justify-center lg:justify-between">
        <section class="lg:inline-flex hidden self-end flex-col items-center gap-5">
          <div class="flex flex-col gap-4 items-center">
            <NuxtImg
              class="w-28"
              src="/img/syncra-logo.png"
            />
            <span class="font-semibold text-5xl">Syncra</span>
          </div>
          <p class="text-lg">
            Sign in or create an account
          </p>
        </section>

        <slot />
      </UContainer>

      <footer>
        <USeparator
          type="dashed"
          class="h-px"
        />
        <UContainer>
          <p class="text-highlighted text-right py-4">
            © {{ new Date().getFullYear() }} Syncra. All rights reserved.
          </p>
        </UContainer>
      </footer>
    </main>
    <BackgroundGradient />
  </div>
</template>
