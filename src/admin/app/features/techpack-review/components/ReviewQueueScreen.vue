<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useReviewQueue } from '../composables/useReviewQueue'
import type { ReviewQueueTab } from '../composables/useReviewQueue'
import type { ReviewItem } from '../models/review-item'

const {
  tab, page, listQuery, items, totalPages, total, loading, refreshing, pending, error, refresh, showStatus, showPage,
} = useReviewQueue()

// In the toolbar, so the tabs sit on its line (one border, not two).
const tabs = computed<(TabsItem & { value: ReviewQueueTab })[]>(() => [
  { label: 'In Review', value: 'in-review', disabled: pending.value },
  { label: 'Reviewed', value: 'reviewed', disabled: pending.value },
])

const totalLabel = computed(() => {
  if (total.value == null) return ''
  return tab.value === 'in-review' ? `${formatCount(total.value)} waiting for review` : `${formatCount(total.value)} reviewed`
})

const reviewedAt = (item: ReviewItem) => formatDateTime(item.reviewedAt) ?? NO_VALUE

const reviewLink = (item: ReviewItem) => ({ path: `/techpack-reviews/${item.fileId}`, query: listQuery.value })

const GRID = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:file-check"
        title="TechPack reviews"
      />
      <UDashboardToolbar>
        <template #left>
          <ListToolbarTabs
            :model-value="tab"
            :items="tabs"
            role="group"
            aria-label="Review status"
            @update:model-value="showStatus"
          />
        </template>
        <template #right>
          <p
            v-if="totalLabel"
            class="hidden text-sm whitespace-nowrap text-muted sm:block"
            role="status"
          >
            {{ totalLabel }}
          </p>
          <UButton
            label="Refresh"
            icon="lucide:refresh-cw"
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="refresh"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <p
        v-if="totalLabel"
        class="text-sm text-muted sm:hidden"
      >
        {{ totalLabel }}
      </p>

      <AlertApiError
        v-if="error"
        :error="error"
        title="Could not load TechPack reviews"
        fallback="Could not load TechPack reviews."
        :retrying="pending"
        @retry="refresh"
      />

      <!-- Card-shaped placeholders, so nothing jumps when the reviews arrive. -->
      <div
        v-else-if="loading"
        role="status"
        aria-label="Loading reviews…"
        :class="GRID"
      >
        <span class="sr-only">Loading reviews…</span>
        <div
          v-for="card in 6"
          :key="card"
          class="space-y-2 rounded-lg border border-default p-4"
        >
          <USkeleton class="h-4 w-4/5" />
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-3 w-2/3" />
        </div>
      </div>

      <ListEmptyState
        v-else-if="!items.length"
        noun="TechPack reviews"
        :title="tab === 'in-review' ? 'No TechPacks are waiting for review.' : 'No reviewed TechPacks.'"
      />

      <ListRefresh
        v-else
        :active="refreshing"
      >
        <ul
          :class="GRID"
          aria-label="TechPack reviews"
        >
          <li
            v-for="item in items"
            :key="item.fileId"
            class="relative flex gap-3 rounded-lg border border-default bg-elevated/40 p-4"
            :class="item.draftUuid && 'pe-9 hover:border-accented'"
          >
            <UIcon
              name="lucide:file-text"
              class="mt-0.5 size-5 shrink-0 text-muted"
            />
            <div class="min-w-0 flex-1 space-y-1.5">
              <ULink
                v-if="item.draftUuid"
                :to="reviewLink(item)"
                :title="item.filename"
                raw
                class="row-link block line-clamp-3 after:rounded-lg"
              >
                {{ item.filename }}
              </ULink>
              <p
                v-else
                :title="item.filename"
                class="line-clamp-3 font-medium wrap-anywhere text-highlighted"
              >
                {{ item.filename }}
              </p>
              <p class="text-xs text-dimmed tabular-nums">
                Company #{{ item.companyId }} · Job #{{ item.jobId }} · File #{{ item.fileId }}
              </p>
              <p
                v-if="tab === 'reviewed'"
                class="text-xs text-muted"
              >
                Reviewed {{ reviewedAt(item) }}
              </p>
            </div>
            <UIcon
              v-if="item.draftUuid"
              name="lucide:chevron-right"
              class="absolute inset-e-3 top-4 size-4 text-muted"
              aria-hidden="true"
            />
          </li>
        </ul>
      </ListRefresh>

      <ListPagination
        :page="page"
        :page-count="totalPages"
        :disabled="pending"
        @update:page="showPage"
      />
    </template>
  </UDashboardPanel>
</template>
