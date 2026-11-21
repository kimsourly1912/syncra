<script setup lang="ts">
import { errorMessage } from '@/api'

/**
 * A failed load, in place of the content: the API's reason (or `fallback`) and a Retry button.
 *
 * @example
 * <AlertApiError v-if="error" :error="error" title="Could not load leads" @retry="refresh" />
 */
const props = defineProps<{
  error: unknown
  title?: string
  /** Shown when the API gives no reason staff can act on. */
  fallback?: string
  /** A retry is running. */
  retrying?: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const message = computed(() => errorMessage(props.error, props.fallback ?? 'Something went wrong. Try again.'))
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="lucide:circle-alert"
    :title="title ?? 'Could not load data'"
    :description="message"
    :actions="[{ label: 'Retry', icon: 'lucide:refresh-cw', color: 'error', variant: 'outline', loading: retrying, onClick: () => emit('retry') }]"
  />
</template>
