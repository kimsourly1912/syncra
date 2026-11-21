<script setup lang="ts">
import { en, zh_cn } from '@nuxt/ui/locale'

const { locale } = useI18n()

const locales = {
  en,
  zh: zh_cn,
}
</script>

<template>
  <UApp
    :locale="locales[locale]"
    :toaster="{
      position: 'top-right',
    }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtLoadingIndicator />
  </UApp>
</template>
