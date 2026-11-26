<script setup lang="ts">
// Every page sets only its own name (`useHead({ title: 'Lead Inquiries' })`); the tab reads
// "Lead Inquiries · Syncra Admin". A page without one reads "Syncra Admin" (nuxt.config.ts).
const APP_NAME = 'Syncra Admin'
useHead({ titleTemplate: title => (title && title !== APP_NAME ? `${title} · ${APP_NAME}` : APP_NAME) })
</script>

<template>
  <UApp :toaster="{ position: 'top-right', max: 3 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtLoadingIndicator />
  </UApp>
</template>
