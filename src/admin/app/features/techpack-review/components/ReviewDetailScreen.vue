<script setup lang="ts">
import type { SplitterItem, TabsItem } from '@nuxt/ui'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { provideReviewDetail } from '../composables/useReviewDetail'
import ReviewApprovedState from './ReviewApprovedState.vue'
import ReviewActionsBar from './ReviewActionsBar.vue'
import ReviewSourcePanel from './ReviewSourcePanel.vue'
import ReviewWorkbookPanel from './ReviewWorkbookPanel.vue'

const props = defineProps<{ fileId: string }>()

const { record, actions, inspection, pane, backLink } = provideReviewDetail(props.fileId)
const { review, draft, loading, error, retry } = record
const { busy, approved, approvedReview } = actions
// After an approval, the approved copy stands in if reloading the record fails.
const current = computed(() => review.value ?? approvedReview.value)

/** From xl the panes sit side by side in a splitter; below it, tabs show one at a time. */
const wide = useBreakpoints(breakpointsTailwind).greaterOrEqual('xl')

// Percent of the width. Each pane keeps enough room for its toolbar.
const splitPanes: SplitterItem[] = [
  { id: 'source', slot: 'source', defaultSize: 45, minSize: 25 },
  { id: 'workbook', slot: 'workbook', defaultSize: 55, minSize: 30 },
]

const panes = computed<TabsItem[]>(() => [
  { label: 'Source PDF', value: 'source', icon: 'lucide:file-text' },
  {
    label: 'Workbook',
    value: 'workbook',
    icon: 'lucide:sheet',
    badge: inspection.findings.value.length
      ? { label: String(inspection.findings.value.length), color: 'warning', variant: 'subtle', size: 'sm' }
      : undefined,
  },
])

const title = computed(() => current.value?.filename ?? 'TechPack review')
const metadata = computed(() => current.value ? `Company ${current.value.companyId} · Job ${current.value.jobId}` : '')
</script>

<template>
  <UDashboardPanel :ui="{ body: 'gap-3 sm:gap-3 py-3 sm:py-3 min-h-0' }">
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
          <USkeleton
            v-if="loading"
            class="h-5 w-48 sm:w-72"
          />
          <span
            v-else
            :title="title"
            class="truncate"
          >{{ title }}</span>
        </template>
        <template #trailing>
          <UBadge
            v-if="current"
            :color="current.status === 'IN_REVIEW' && !approved ? 'warning' : 'success'"
            :label="current.status === 'IN_REVIEW' && !approved ? 'In Review' : 'Reviewed'"
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

      <!-- First: a successful approval stays visible even if reloading the record then fails. -->
      <ReviewApprovedState
        v-if="current && (approved || current.status === 'REVIEWED')"
        :review="current"
        :just-approved="approved"
        :back-link="backLink"
      />
      <UAlert
        v-else-if="error"
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
      <!-- The workspace's shape while the review loads, so nothing jumps when it arrives. -->
      <div
        v-else-if="loading"
        role="status"
        aria-label="Loading review…"
        class="flex min-h-[28rem] flex-1 flex-col gap-3"
      >
        <span class="sr-only">Loading review…</span>
        <div class="flex gap-4 xl:hidden">
          <USkeleton class="h-6 w-28" />
          <USkeleton class="h-6 w-28" />
        </div>
        <div class="flex min-h-0 flex-1 gap-3">
          <div
            v-for="index in 2"
            :key="index"
            class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-default"
            :class="{ 'max-xl:hidden': index === 2 }"
          >
            <div class="flex items-center justify-between border-b border-default px-3 py-3">
              <USkeleton class="h-5 w-32" />
              <USkeleton class="h-5 w-24" />
            </div>
            <div class="flex-1 space-y-3 p-4">
              <USkeleton
                v-for="line in 6"
                :key="line"
                class="h-4"
                :class="line % 3 ? 'w-full' : 'w-2/3'"
              />
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-3">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-8 w-40" />
        </div>
      </div>
      <!-- The workspace fills the height between the header and the footer, and each pane scrolls
           inside itself; neither pane's content sets the other's height. On a short screen it keeps
           28rem and the page scrolls. -->
      <section
        v-else-if="draft"
        aria-label="TechPack review workspace"
        class="flex min-h-[28rem] min-w-0 flex-1 flex-col gap-3"
      >
        <!-- From xl: side by side, with a divider the reviewer can drag (remembered per browser). -->
        <USplitter
          v-if="wide"
          :items="splitPanes"
          auto-save-id="techpack-review-split"
          class="min-h-0 flex-1"
          :ui="{ handle: 'w-3' }"
          aria-label="Source PDF and draft workbook"
        >
          <template #source>
            <ReviewSourcePanel class="flex-1" />
          </template>
          <template #workbook>
            <ReviewWorkbookPanel class="flex-1" />
          </template>
          <template #resize-handle>
            <!-- A thin line with a grip; it turns primary on hover, focus, and drag. -->
            <div class="mx-auto flex h-full w-px items-center justify-center bg-accented group-hover:bg-primary group-focus-visible:bg-primary group-data-[resize-handle-state=drag]:bg-primary">
              <span class="h-10 w-1.5 shrink-0 rounded-full bg-accented group-hover:bg-primary group-focus-visible:bg-primary group-data-[resize-handle-state=drag]:bg-primary" />
            </div>
          </template>
        </USplitter>

        <!-- Below xl: one full-height pane at a time. Both stay mounted, so switching keeps the PDF page. -->
        <template v-else>
          <UTabs
            v-model="pane"
            :items="panes"
            :content="false"
            variant="link"
            size="sm"
          />
          <div class="flex min-h-0 flex-1 flex-col">
            <ReviewSourcePanel
              v-show="pane === 'source'"
              class="flex-1"
            />
            <ReviewWorkbookPanel
              v-show="pane === 'workbook'"
              class="flex-1"
            />
          </div>
        </template>
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
