<script setup lang="ts">
import type { NuxtError } from '#app'
import { redirectTarget } from '@/features/session'

// Nuxt renders this instead of app.vue for a fatal error: a missing page, or the route guard
// finding the API unavailable (it passes `data.retry`, the page to try again).
const props = defineProps<{ error: NuxtError<{ retry?: unknown }> }>()

const retry = computed(() => {
  const target = props.error.data?.retry
  return typeof target === 'string' ? redirectTarget(target) : undefined
})

// A full reload, not `clearError({ redirect })`: navigating to the page that failed is a
// duplicate navigation, so the route guard wouldn't run and the session would stay unloaded.
function tryAgain() {
  if (retry.value) reloadNuxtApp({ path: retry.value, force: true })
}
</script>

<template>
  <UApp>
    <NuxtLayout name="auth">
      <UError
        :error="error"
        :clear="!retry"
      >
        <template
          v-if="retry"
          #links
        >
          <UButton
            label="Try again"
            icon="lucide:refresh-cw"
            size="lg"
            @click="tryAgain"
          />
        </template>
      </UError>
    </NuxtLayout>
  </UApp>
</template>
