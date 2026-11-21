<script setup lang="ts">
import AccountDetailFields from './AccountDetailFields.vue'

const activationPeriod = [
  { label: 'Start date', value: '1 Jan 2026' },
  { label: 'End date', value: 'No expiry' },
]
</script>

<template>
  <UCard
    as="section"
    aria-label="Doc AI"
    :ui="{ header: 'p-4 sm:p-5', body: 'p-4 sm:p-5', footer: 'p-4 sm:px-5 sm:py-3' }"
  >
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <UIcon
              name="lucide:file-text"
              class="size-5"
            />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">
              Doc AI
            </h2>
            <p class="text-sm text-muted">
              AI-powered document extraction for tech packs, invoices, and compliance documents.
            </p>
          </div>
        </div>
        <UBadge
          label="Active"
          color="success"
          variant="subtle"
        />
      </div>
    </template>

    <div class="grid gap-4 @min-[37rem]:grid-cols-2 @min-[37rem]:gap-6">
      <div>
        <h3 class="font-semibold text-highlighted">
          Activation period
        </h3>
        <AccountDetailFields :fields="activationPeriod" />
      </div>
      <div class="border-t border-default pt-4 @min-[37rem]:border-s @min-[37rem]:border-t-0 @min-[37rem]:ps-6 @min-[37rem]:pt-0">
        <h3 class="font-semibold text-highlighted">
          Enabled features
        </h3>
        <p class="mt-3 flex items-center gap-2 rounded-md border border-default px-3 py-2 text-sm text-highlighted">
          <UIcon
            name="lucide:file-text"
            class="size-4 text-muted"
          />
          TechPack
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          label="Deactivate"
          color="error"
          variant="outline"
          disabled
        />
        <UButton
          label="Edit activation"
          icon="lucide:pencil"
          disabled
        />
      </div>
    </template>
  </UCard>
</template>
