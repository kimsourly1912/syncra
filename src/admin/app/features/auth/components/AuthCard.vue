<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * The frame of every guest page: an optional "Back to sign in", the logo (or a status icon),
 * the title and help text, an inline error, then the page's form or actions.
 */
defineProps<{
  title: string
  description?: string
  /** A status icon in place of the logo (sent, changed, expired). */
  icon?: string
  iconColor?: 'primary' | 'success' | 'error' | 'warning' | 'neutral'
  /** Where "Back to sign in" goes; no link when unset. */
  back?: RouteLocationRaw
  /** Why the last submit failed, shown above the form. */
  error?: string
}>()
</script>

<template>
  <div class="w-full max-w-md px-4 py-10">
    <section class="bg-default ring ring-default rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
      <UButton
        v-if="back"
        :to="back"
        icon="lucide:arrow-left"
        label="Back to sign in"
        color="neutral"
        variant="link"
        size="sm"
        class="-ms-1.5 -mt-2 sm:-mt-4"
      />

      <header class="flex flex-col items-center gap-3 text-center">
        <UBadge
          v-if="icon"
          :icon
          :color="iconColor ?? 'primary'"
          variant="subtle"
          size="xl"
          square
          class="rounded-full p-3"
        />
        <img
          v-else
          src="/img/syncra-logo.png"
          alt="Syncra"
          class="size-12"
        >
        <h1 class="text-2xl font-semibold text-highlighted text-balance">
          {{ title }}
        </h1>
        <p
          v-if="description || $slots.description"
          class="text-muted text-pretty"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </header>

      <UAlert
        v-if="error"
        role="alert"
        color="error"
        variant="subtle"
        icon="lucide:circle-alert"
        :title="error"
      />

      <slot />

      <footer
        v-if="$slots.footer"
        class="text-center text-sm text-muted"
      >
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>
