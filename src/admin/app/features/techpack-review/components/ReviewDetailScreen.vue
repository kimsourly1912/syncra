<script setup lang="ts">
import { provideReviewDetail } from '../composables/useReviewDetail'
import ReviewActionsBar from './ReviewActionsBar.vue'
import ReviewSourcePanel from './ReviewSourcePanel.vue'
import ReviewWorkbookPanel from './ReviewWorkbookPanel.vue'

const props = defineProps<{
  fileId: string
}>()

const { record, actions, backLink } = provideReviewDetail(props.fileId)
const { review, loading, error } = record
const { busy } = actions
</script>

<template>
  <section class="min-w-0 space-y-4">
    <header class="space-y-3">
      <UButton
        label="TechPack reviews"
        icon="lucide:arrow-left"
        color="neutral"
        variant="ghost"
        :to="backLink"
        :disabled="busy"
      />
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="min-w-0 break-all text-2xl font-semibold text-highlighted">
          {{ review?.filename ?? 'TechPack review' }}
        </h1>
        <UBadge
          v-if="review"
          :color="review.status === 'IN_REVIEW' ? 'warning' : 'success'"
          :label="review.status === 'IN_REVIEW' ? 'In Review' : 'Reviewed'"
          variant="subtle"
        />
      </div>
      <p
        v-if="review"
        class="text-sm text-muted"
      >
        Company {{ review.companyId }} · Job {{ review.jobId }}
      </p>
    </header>

    <UAlert
      v-if="error"
      color="error"
      :title="error"
    />
    <p
      v-else-if="loading"
      class="text-sm text-muted"
      role="status"
    >
      Loading review…
    </p>
    <UAlert
      v-else-if="review?.status === 'REVIEWED'"
      color="success"
      title="Workbook reviewed and released."
    />
    <div
      v-else-if="review?.draftUuid"
      class="space-y-4"
    >
      <div class="grid overflow-hidden rounded-lg border border-default bg-default divide-y divide-default lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:divide-x lg:divide-y-0">
        <ReviewSourcePanel />
        <ReviewWorkbookPanel />
      </div>
      <ReviewActionsBar />
    </div>
  </section>
</template>
