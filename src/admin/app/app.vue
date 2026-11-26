<script setup lang="ts">
// Every page sets only its own name (`definePageMeta({ title: 'Lead inquiries' })`); the tab reads
// "Lead inquiries · Syncra Admin". A page without one reads "Syncra Admin" (nuxt.config.ts). A
// screen may name the tab after its record instead (`useHead` in useReviewDetail).
const APP_NAME = 'Syncra Admin'
const route = useRoute()
useHead({
  title: () => route.meta.title,
  titleTemplate: title => (title && title !== APP_NAME ? `${title} · ${APP_NAME}` : APP_NAME),
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right', max: 3 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtLoadingIndicator />
  </UApp>
</template>
