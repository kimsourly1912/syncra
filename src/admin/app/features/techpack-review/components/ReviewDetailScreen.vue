<script setup lang="ts">
import { provideReviewDetail } from '../composables/useReviewDetail'
import ReviewActionsBar from './ReviewActionsBar.vue'
import ReviewFindingsList from './ReviewFindingsList.vue'
import ReviewSourcePanel from './ReviewSourcePanel.vue'
import ReviewWorkbookPanel from './ReviewWorkbookPanel.vue'

const props = defineProps<{ fileId: string }>()

const { record, actions, backLink } = provideReviewDetail(props.fileId)
const { review, draft, loading, error, retry } = record
const { busy } = actions

const title = computed(() => review.value?.filename ?? 'TechPack review')
const metadata = computed(() => review.value ? `Company ${review.value.companyId} · Job ${review.value.jobId}` : '')
</script>

<template>
  <UDashboardPanel :ui="{ body: 'gap-3 sm:gap-3 py-3 sm:py-3 lg:min-h-0' }">
    <template #header>
      <UDashboardNavbar
        :title="title"
        :ui="{ left: 'min-w-0', title: 'min-w-0 truncate' }"
      >
        <template #leading>
          <UButton
            aria-label="Back to TechPack reviews"
            title="Back to TechPack reviews"
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            :to="backLink"
            :disabled="busy"
          />
          <UIcon
            name="lucide:file-search"
            class="hidden size-4 shrink-0 text-primary sm:block"
          />
        </template>
        <template #title>
          <span
            :title="title"
            class="truncate"
          >{{ title }}</span>
        </template>
        <template #trailing>
          <UBadge
            v-if="review"
            :color="review.status === 'IN_REVIEW' ? 'warning' : 'success'"
            :label="review.status === 'IN_REVIEW' ? 'In Review' : 'Reviewed'"
            class="shrink-0"
            variant="subtle"
          />
        </template>
        <template #right>
          <p
            v-if="metadata"
            class="hidden text-sm whitespace-nowrap text-muted sm:block"
          >
            {{ metadata }}
          </p>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p
        v-if="metadata"
        class="text-sm text-muted sm:hidden"
      >
        {{ metadata }}
      </p>

      <UAlert
        v-if="error"
        color="error"
        :title="error"
      >
        <template
          v-if="retry"
          #actions
        >
          <UButton
            label="Retry"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="busy"
            @click="retry"
          />
        </template>
      </UAlert>
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
      <section
        v-else-if="draft"
        aria-label="TechPack review workspace"
        class="@container flex min-w-0 flex-col gap-3 lg:min-h-0 lg:flex-1"
      >
        <div class="grid gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto @min-[46rem]:grid-cols-2 @min-[72rem]:auto-rows-[minmax(26rem,1fr)] @min-[72rem]:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_minmax(17rem,4fr)]">
          <ReviewSourcePanel />
          <ReviewWorkbookPanel />
          <ReviewFindingsList class="@min-[46rem]:col-span-2 @min-[72rem]:col-span-1" />
        </div>
        <ReviewActionsBar />
      </section>
      <UAlert
        v-else-if="review"
        color="warning"
        title="This review has no draft workbook available."
      />
    </template>
  </UDashboardPanel>
</template>
