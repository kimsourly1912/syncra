<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { NuxtError } from '#app'
import { SESSION_PATHS, redirectTarget } from '@/features/session'

// Nuxt renders this instead of app.vue for a fatal error: a missing page, or the route guard
// finding the API unavailable (it passes `data.retry`, the page to try again).
const props = defineProps<{ error: NuxtError<{ retry?: unknown }> }>()

const retry = computed(() => {
  const target = props.error.data?.retry
  return typeof target === 'string' ? redirectTarget(target) : undefined
})

const status = computed(() => props.error.status ?? props.error.statusCode ?? 500)

const view = computed(() => {
  if (retry.value) {
    return {
      icon: 'lucide:cloud-off',
      tone: 'warning',
      eyebrow: 'Service unavailable',
      title: props.error.statusText || 'Syncra Admin is unavailable',
      description: 'We couldn\'t reach the Syncra API. Check your connection, then try again.',
    } as const
  }
  if (status.value === 404) {
    return {
      icon: 'lucide:map-pin-off',
      tone: 'neutral',
      eyebrow: 'Not found',
      title: 'Page not found',
      description: 'This page doesn\'t exist, or the link is wrong.',
    } as const
  }
  return {
    icon: 'lucide:triangle-alert',
    tone: 'error',
    eyebrow: 'Unexpected error',
    title: 'Something went wrong',
    description: 'An unexpected error stopped this page from loading.',
  } as const
})

const toneText = {
  warning: 'text-warning',
  neutral: 'text-muted',
  error: 'text-error',
}

// The technical reason, when it adds something to the title (the API's message, a thrown error).
const detail = computed(() => {
  const message = props.error.message?.trim()
  if (!message || message === view.value.title || message === props.error.statusText) return undefined
  return message
})

// A full reload, not `clearError({ redirect })`: navigating to the page that failed is a
// duplicate navigation, so the route guard wouldn't run and the session would stay unloaded.
function tryAgain() {
  if (retry.value) reloadNuxtApp({ path: retry.value, force: true })
}

const router = useRouter()

const actions = computed<ButtonProps[]>(() => {
  if (retry.value) {
    return [{ label: 'Try again', icon: 'lucide:refresh-cw', onClick: tryAgain }]
  }
  return [
    { label: 'Go back', color: 'neutral', variant: 'outline', onClick: () => router.back() },
    { label: 'Back to dashboard', onClick: () => clearError({ redirect: SESSION_PATHS.home }) },
  ]
})

useHead({ title: () => view.value.title })
</script>

<template>
  <UApp>
    <NuxtLayout name="auth">
      <!-- The same frame as the guest pages' AuthCard. -->
      <div class="w-full max-w-md px-4 py-10">
        <UEmpty
          :avatar="{ icon: view.icon, ui: { icon: toneText[view.tone] } }"
          :title="view.title"
          :description="view.description"
          :actions="actions"
          variant="outline"
          class="rounded-xl shadow-sm"
          :ui="{ root: 'p-6 sm:p-8 lg:p-8' }"
        >
          <template #footer>
            <p class="text-xs text-muted">
              {{ status }} · {{ view.eyebrow }}
            </p>
            <p
              v-if="detail"
              class="text-xs text-muted text-pretty wrap-break-word"
            >
              {{ detail }}
            </p>
          </template>
        </UEmpty>
      </div>
    </NuxtLayout>
  </UApp>
</template>
