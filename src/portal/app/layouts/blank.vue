<script setup lang="ts">
</script>

<template>
  <div>
    <main class="min-h-screen flex flex-col">
      <UContainer class="py-10 flex-1 flex items-center justify-center">
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
