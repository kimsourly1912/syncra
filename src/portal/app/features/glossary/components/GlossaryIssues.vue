<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'

defineProps<{
  warnings?: GlossaryDTO.GlossaryIssue[]
  blockingErrors?: GlossaryDTO.GlossaryIssue[]
}>()

const { t } = useI18n()
</script>

<template>
  <section
    v-if="blockingErrors?.length || warnings?.length"
    class="space-y-3"
  >
    <div
      v-if="blockingErrors?.length"
      class="overflow-hidden rounded-2xl border border-error/30 bg-error/5"
    >
      <header class="flex items-center gap-2 border-b border-error/20 px-4 py-3 text-error">
        <UIcon
          name="lucide:octagon-alert"
          class="size-5"
        />
        <h3 class="font-semibold">
          {{ t('glossary.issues.blockingTitle') }}
        </h3>
      </header>
      <ul class="divide-y divide-error/15">
        <li
          v-for="(issue, index) in blockingErrors"
          :key="`${issue.message}-${index}`"
          class="flex gap-3 px-4 py-3 text-sm"
        >
          <UBadge
            v-if="issue.rowNumbers.length"
            color="error"
            variant="subtle"
            :label="t('glossary.issues.rows', { rows: issue.rowNumbers.join(', ') })"
            class="h-fit shrink-0"
          />
          <span class="text-highlighted">{{ issue.message }}</span>
        </li>
      </ul>
    </div>

    <div
      v-if="warnings?.length"
      class="overflow-hidden rounded-2xl border border-warning/30 bg-warning/5"
    >
      <header class="flex items-center gap-2 border-b border-warning/20 px-4 py-3 text-warning">
        <UIcon
          name="lucide:triangle-alert"
          class="size-5"
        />
        <h3 class="font-semibold">
          {{ t('glossary.issues.warningTitle') }}
        </h3>
      </header>
      <ul class="divide-y divide-warning/15">
        <li
          v-for="(issue, index) in warnings"
          :key="`${issue.message}-${index}`"
          class="flex gap-3 px-4 py-3 text-sm"
        >
          <UBadge
            v-if="issue.rowNumbers.length"
            color="warning"
            variant="subtle"
            :label="t('glossary.issues.rows', { rows: issue.rowNumbers.join(', ') })"
            class="h-fit shrink-0"
          />
          <span class="text-highlighted">{{ issue.message }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
