<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { useNextReview } from '../composables/useNextReview'
import type { ReviewItem } from '../models/review-item'

const props = defineProps<{
  review: ReviewItem
  /** Approved in this visit, rather than opened after release. */
  justApproved: boolean
  backLink: RouteLocationRaw
}>()

const { next, loading, error } = useNextReview(props.review.fileId)

const reviewedAt = computed(() => formatDateTime(props.review.reviewedAt) ?? '')
</script>

<template>
  <section
    aria-label="Review result"
    class="flex flex-1 items-center justify-center p-6"
  >
    <div class="max-w-md space-y-4 text-center">
      <UIcon
        name="lucide:circle-check"
        class="mx-auto size-12 text-success"
      />
      <div class="space-y-1">
        <h2
          class="text-xl font-semibold text-highlighted"
          role="status"
        >
          {{ justApproved ? 'Workbook approved and released' : 'Workbook reviewed and released' }}
        </h2>
        <p class="text-sm wrap-anywhere text-muted">
          {{ review.filename }} · Job {{ review.jobId }}
        </p>
        <p
          v-if="reviewedAt"
          class="text-sm text-muted"
        >
          Reviewed {{ reviewedAt }}
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          label="Back to queue"
          color="neutral"
          variant="outline"
          :to="backLink"
        />
        <UButton
          v-if="loading || next"
          label="Open next review"
          trailing-icon="lucide:arrow-right"
          :loading="loading"
          :to="next ? `/techpack-reviews/${next.fileId}` : undefined"
        />
      </div>
      <p
        v-if="!loading && !next && !error"
        class="text-sm text-muted"
      >
        No other TechPacks are waiting for review.
      </p>
    </div>
  </section>
</template>
