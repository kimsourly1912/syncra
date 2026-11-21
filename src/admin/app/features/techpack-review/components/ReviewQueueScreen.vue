<script setup lang="ts">
import type { ListStatusTab } from '@/components/list/ListStatusTabs.vue'
import { useReviewQueue } from '../composables/useReviewQueue'
import type { ReviewQueueTab } from '../composables/useReviewQueue'

const { tab, status, page, listQuery, items, totalPages, loading, refreshing, pending, error, refresh, showStatus, showPage } = useReviewQueue()

const tabs: ListStatusTab<ReviewQueueTab>[] = [
  { label: 'In Review', value: 'in-review' },
  { label: 'Reviewed', value: 'reviewed' },
]
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3 border-b border-default">
      <ListStatusTabs
        :model-value="tab"
        :items="tabs"
        :disabled="pending"
        aria-label="Review status"
        @update:model-value="showStatus"
      />
      <UButton
        label="Refresh"
        icon="lucide:refresh-cw"
        color="neutral"
        variant="ghost"
        :loading="pending"
        @click="refresh"
      />
    </div>

    <AlertApiError
      v-if="error"
      :error="error"
      title="Could not load TechPack reviews"
      fallback="Could not load TechPack reviews."
      :retrying="pending"
      @retry="refresh"
    />

    <UCard v-else-if="loading">
      <div
        role="status"
        aria-label="Loading reviews…"
        class="divide-y divide-default"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="space-y-2 py-3"
        >
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-3 w-1/4" />
        </div>
      </div>
    </UCard>

    <ListRefresh
      v-else
      :active="refreshing"
    >
      <UCard>
        <ListEmptyState
          v-if="!items.length"
          noun="TechPack reviews"
          :title="status === 'IN_REVIEW' ? 'No TechPacks are waiting for review.' : 'No reviewed TechPacks.'"
        />
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="item in items"
            :key="item.fileId"
            class="relative flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div class="min-w-0">
              <!-- The filename opens the review: it holds only the name and stretches over the row. -->
              <ULink
                v-if="item.draftUuid"
                :to="{ path: '/techpack-reviews/' + item.fileId, query: listQuery }"
                class="font-medium break-all text-highlighted after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-primary"
              >
                {{ item.filename }}
              </ULink>
              <p
                v-else
                class="font-medium break-all text-highlighted"
              >
                {{ item.filename }}
              </p>
              <p class="text-sm text-muted">
                Company {{ item.companyId }} · Job {{ item.jobId }}
              </p>
            </div>
            <UIcon
              v-if="item.draftUuid"
              name="lucide:chevron-right"
              class="size-5 text-dimmed"
            />
            <span
              v-else-if="item.reviewedAt"
              class="text-sm text-muted"
            >
              {{ new Date(item.reviewedAt).toLocaleString() }}
            </span>
          </li>
        </ul>
      </UCard>
    </ListRefresh>

    <ListPagination
      :page="page"
      :page-count="totalPages"
      :disabled="pending"
      @update:page="showPage"
    />
  </section>
</template>
