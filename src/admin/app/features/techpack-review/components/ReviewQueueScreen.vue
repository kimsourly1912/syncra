<script setup lang="ts">
import { useReviewQueue } from '../composables/useReviewQueue'

const { status, page, listQuery, items, totalPages, loading, pending, listError, refresh, showStatus, showPage } = useReviewQueue()
</script>

<template>
  <section class="max-w-5xl space-y-5">
    <div class="flex flex-wrap gap-2">
      <UButton
        label="In Review"
        :variant="status === 'IN_REVIEW' ? 'solid' : 'outline'"
        :disabled="pending"
        @click="showStatus('in-review')"
      />
      <UButton
        label="Reviewed"
        :variant="status === 'REVIEWED' ? 'solid' : 'outline'"
        :disabled="pending"
        @click="showStatus('reviewed')"
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

    <UAlert
      v-if="listError"
      color="error"
      :title="listError"
    />

    <UCard v-if="!listError">
      <p
        v-if="loading"
        class="text-muted"
      >
        Loading reviews…
      </p>
      <p
        v-else-if="!items.length"
        class="text-muted"
      >
        {{ status === 'IN_REVIEW' ? 'No TechPacks are waiting for review.' : 'No reviewed TechPacks.' }}
      </p>
      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="item in items"
          :key="item.fileId"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium break-all">
              {{ item.filename }}
            </p>
            <p class="text-sm text-muted">
              Company {{ item.companyId }} · Job {{ item.jobId }}
            </p>
          </div>
          <UButton
            v-if="item.draftUuid"
            label="Open review"
            variant="subtle"
            :to="{ path: '/techpack-reviews/' + item.fileId, query: listQuery }"
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

    <div
      v-if="totalPages > 1"
      class="flex items-center gap-3"
    >
      <UButton
        label="Previous"
        variant="outline"
        :disabled="pending || page <= 1"
        @click="showPage(page - 1)"
      />
      <span class="text-sm text-muted">Page {{ page }} of {{ totalPages }}</span>
      <UButton
        label="Next"
        variant="outline"
        :disabled="pending || page >= totalPages"
        @click="showPage(page + 1)"
      />
    </div>
  </section>
</template>
