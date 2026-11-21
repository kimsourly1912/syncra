<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { findingLabel, workbookCellKey } from '../utils/findings'
import type { ReviewFinding } from '../utils/findings'

const props = defineProps<{ finding: ReviewFinding }>()

const { workbook, actions } = useReviewDetail()
const { edits, originalValue, stage, undo } = workbook
const { canEdit } = actions
const original = computed(() => originalValue(props.finding))
const edit = computed(() => edits.get(workbookCellKey(props.finding)))
const value = computed(() => edit.value ?? original.value)
</script>

<template>
  <section
    aria-label="Selected review issue"
    class="m-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-warning/25 bg-warning/5 px-3 py-2 text-sm"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <UBadge
        :label="finding.origin === 'pdf' ? 'PDF difference' : 'AI flag'"
        :color="finding.origin === 'pdf' ? 'warning' : 'neutral'"
        variant="subtle"
        size="sm"
      />
      <h3 class="font-semibold wrap-anywhere text-highlighted">
        {{ findingLabel(finding) }}
      </h3>
    </div>

    <dl class="min-w-0">
      <dt class="text-xs text-muted">
        {{ finding.origin === 'pdf' ? 'PDF value' : 'AI read' }}
      </dt>
      <dd class="font-semibold wrap-anywhere text-highlighted">
        {{ finding.referenceValue || 'Blank' }}
      </dd>
    </dl>

    <div class="flex min-w-0 flex-wrap items-end gap-2">
      <UFormField
        label="Corrected value"
        name="techpack-inline-value"
        size="sm"
      >
        <UInput
          :model-value="value"
          :disabled="!canEdit"
          :maxlength="64"
          autocomplete="off"
          size="sm"
          class="w-28 max-w-full"
          @update:model-value="stage(finding, String($event ?? ''))"
        />
      </UFormField>
      <div
        v-if="edit !== undefined"
        class="flex min-w-0 items-center gap-1 self-end"
      >
        <span class="py-1.5 text-xs wrap-anywhere text-muted">Was {{ original || 'blank' }}</span>
        <UButton
          aria-label="Undo change"
          title="Undo change"
          icon="lucide:undo-2"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canEdit"
          @click="undo(finding)"
        />
      </div>
      <UButton
        v-if="finding.origin === 'pdf' && value !== finding.referenceValue"
        :label="finding.referenceValue ? 'Use PDF value' : 'Use blank from PDF'"
        variant="soft"
        size="sm"
        :disabled="!canEdit"
        @click="stage(finding, finding.referenceValue)"
      />
    </div>
  </section>
</template>
