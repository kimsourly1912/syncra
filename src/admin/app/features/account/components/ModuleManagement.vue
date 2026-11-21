<script setup lang="ts">
import type { ListDetail } from '@/components/list/ListDetails.vue'

const activationItems: ListDetail[] = [
  {
    label: 'Start Date',
    value: '2026-01-01',
  },
  {
    label: 'End Date',
    value: 'No Expiry',
  },
]
</script>

<template>
  <UPageCard
    title="Module Management"
    variant="naked"
  />

  <UPageCard variant="subtle">
    <section class="flex items-start justify-between gap-4">
      <section class="flex gap-4 sm:flex-row flex-col">
        <section class="flex items-start justify-between gap-4">
          <div class="size-16 min-w-16 rounded-lg flex items-center justify-center bg-default">
            <img
              src="/img/doc-ai.png"
              class="w-full"
            >
          </div>
          <UBadge
            variant="subtle"
            label="Active"
            size="lg"
            class="sm:hidden"
          />
        </section>

        <div>
          <h2 class="text-lg font-medium text-highlighted">
            Doc AI
          </h2>
          <p class="text-muted">
            AI-powered document processing and extraction for tech packs, invoices, and compliance documents
          </p>
        </div>
      </section>

      <UBadge
        class="max-sm:hidden"
        variant="subtle"
        label="Active"
        size="lg"
      />
    </section>

    <USeparator />

    <UPageCard
      title="Activation Period"
      variant="outline"
    >
      <ListDetails :items="activationItems" />
    </UPageCard>

    <UPageCard
      title="Activated Feature"
      variant="naked"
    >
      <UButton
        label="TechPack"
        variant="outline"
        class="w-fit"
      />
    </UPageCard>

    <USeparator />

    <div class="flex gap-4 justify-end flex-wrap">
      <UButton
        label="Deactivate"
        color="error"
        variant="outline"
      />
      <UButton
        label="Edit Activation"
        color="neutral"
        variant="outline"
      />
    </div>
  </UPageCard>
</template>
