<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'
import GlossaryCountStrip from '@/features/glossary/components/GlossaryCountStrip.vue'

defineProps<{
  preview: GlossaryDTO.GlossaryPreview
}>()

const { t } = useI18n()
</script>

<template>
  <section class="space-y-4">
    <GlossaryCountStrip :counts="preview.counts" />

    <div
      v-if="preview.added.length"
      class="overflow-hidden rounded-2xl border border-success/25"
    >
      <header class="flex items-center justify-between gap-3 bg-success/5 px-4 py-3">
        <div class="flex items-center gap-2 text-success">
          <UIcon
            name="lucide:circle-plus"
            class="size-5"
          />
          <h3 class="font-semibold">
            {{ t('glossary.diff.addedTitle') }}
          </h3>
        </div>
        <span class="font-mono text-sm text-muted">+{{ preview.counts.added }}</span>
      </header>
      <div class="divide-y divide-default">
        <article
          v-for="row in preview.added"
          :key="row.normalizedKey"
          class="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
        >
          <p class="font-medium text-highlighted">
            {{ row.englishText }}
          </p>
          <UIcon
            name="lucide:arrow-right"
            class="hidden size-4 text-muted sm:block"
          />
          <p class="text-base text-highlighted sm:text-right">
            {{ row.chineseText }}
          </p>
        </article>
      </div>
      <p
        v-if="preview.addedTruncated"
        class="border-t border-success/20 bg-success/5 px-4 py-2 text-xs text-muted"
      >
        {{ t('glossary.diff.truncated') }}
      </p>
    </div>

    <div
      v-if="preview.changed.length"
      class="overflow-hidden rounded-2xl border border-warning/25"
    >
      <header class="flex items-center justify-between gap-3 bg-warning/5 px-4 py-3">
        <div class="flex items-center gap-2 text-warning">
          <UIcon
            name="lucide:refresh-cw"
            class="size-5"
          />
          <h3 class="font-semibold">
            {{ t('glossary.diff.changedTitle') }}
          </h3>
        </div>
        <span class="font-mono text-sm text-muted">~{{ preview.counts.changed }}</span>
      </header>
      <div class="divide-y divide-default">
        <article
          v-for="row in preview.changed"
          :key="row.normalizedKey"
          class="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] lg:items-center"
        >
          <div class="rounded-xl bg-elevated/70 p-3">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {{ t('glossary.diff.before') }}
            </p>
            <p class="text-sm text-muted line-through decoration-warning/60">
              {{ row.currentEnglishText }}
            </p>
            <p class="mt-1 text-highlighted">
              {{ row.currentChineseText }}
            </p>
          </div>
          <div class="grid size-8 place-items-center justify-self-center rounded-full bg-warning/10 text-warning">
            <UIcon
              name="lucide:arrow-right"
              class="size-4"
            />
          </div>
          <div class="rounded-xl bg-warning/5 p-3 ring-1 ring-inset ring-warning/15">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
              {{ t('glossary.diff.after') }}
            </p>
            <p class="text-sm font-medium text-highlighted">
              {{ row.englishText }}
            </p>
            <p class="mt-1 text-highlighted">
              {{ row.newChineseText }}
            </p>
          </div>
        </article>
      </div>
      <p
        v-if="preview.changedTruncated"
        class="border-t border-warning/20 bg-warning/5 px-4 py-2 text-xs text-muted"
      >
        {{ t('glossary.diff.truncated') }}
      </p>
    </div>

    <div
      v-if="preview.removed.length"
      class="overflow-hidden rounded-2xl border border-error/30"
    >
      <header class="flex items-center justify-between gap-3 bg-error/7 px-4 py-3">
        <div class="flex items-center gap-2 text-error">
          <UIcon
            name="lucide:circle-minus"
            class="size-5"
          />
          <div>
            <h3 class="font-semibold">
              {{ t('glossary.diff.removedTitle') }}
            </h3>
            <p class="mt-0.5 text-xs text-muted">
              {{ t('glossary.diff.removedHelp') }}
            </p>
          </div>
        </div>
        <span class="font-mono text-sm text-muted">−{{ preview.counts.removed }}</span>
      </header>
      <div class="divide-y divide-default">
        <article
          v-for="row in preview.removed"
          :key="row.normalizedKey"
          class="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
        >
          <p class="font-medium text-highlighted">
            {{ row.englishText }}
          </p>
          <UIcon
            name="lucide:arrow-right"
            class="hidden size-4 text-muted sm:block"
          />
          <p class="text-base text-highlighted sm:text-right">
            {{ row.chineseText }}
          </p>
        </article>
      </div>
      <p
        v-if="preview.removedTruncated"
        class="border-t border-error/20 bg-error/5 px-4 py-2 text-xs text-muted"
      >
        {{ t('glossary.diff.truncated') }}
      </p>
    </div>

    <div
      v-if="!preview.added.length && !preview.changed.length && !preview.removed.length && !preview.blockingErrors.length"
      class="rounded-2xl border border-dashed border-default bg-elevated/30 px-6 py-10 text-center"
    >
      <div class="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success">
        <UIcon
          name="lucide:check-check"
          class="size-6"
        />
      </div>
      <h3 class="mt-4 font-semibold text-highlighted">
        {{ t('glossary.diff.noChangesTitle') }}
      </h3>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted">
        {{ t('glossary.diff.noChangesDescription') }}
      </p>
    </div>
  </section>
</template>
