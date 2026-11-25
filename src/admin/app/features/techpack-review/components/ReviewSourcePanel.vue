<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { source, actions } = useReviewDetail()
const { image, page, pageCount, zoom, loading, error, canZoomIn, canZoomOut } = source
const { busy, downloading } = actions

const viewport = useTemplateRef<HTMLDivElement>('viewport')

function reportImage(event: Event, status: 'shown' | 'failed') {
  const element = event.currentTarget as HTMLImageElement
  source.reportImage(element.getAttribute('src') ?? '', Number(element.dataset.page), status)
}

watch(page, () => viewport.value?.scrollTo(0, 0), { flush: 'post' })
</script>

<template>
  <section
    aria-label="Source PDF"
    class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-default"
  >
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-2">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="lucide:file-text"
          class="size-4 text-primary"
        />
        Source PDF
      </h2>
      <UButton
        label="Download PDF"
        icon="lucide:download"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="busy"
        :loading="downloading === 'source'"
        @click="actions.download('source')"
      />
    </header>

    <div
      v-if="pageCount"
      class="flex flex-wrap items-center justify-between gap-1 border-b border-default px-2 py-1"
    >
      <div class="flex items-center gap-1">
        <UButton
          aria-label="Previous PDF page"
          icon="lucide:chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="loading || page <= 1"
          @click="source.showPage(page - 1)"
        />
        <span
          aria-live="polite"
          class="min-w-20 text-center text-sm text-muted"
        >Page {{ page }} of {{ pageCount }}</span>
        <UButton
          aria-label="Next PDF page"
          icon="lucide:chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="loading || page >= pageCount"
          @click="source.showPage(page + 1)"
        />
      </div>
      <div class="flex items-center gap-1">
        <UButton
          aria-label="Zoom out PDF"
          icon="lucide:minus"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canZoomOut"
          @click="source.zoomOut"
        />
        <span class="min-w-10 text-center text-sm text-muted">{{ canZoomOut ? zoom + '%' : 'Fit' }}</span>
        <UButton
          aria-label="Zoom in PDF"
          icon="lucide:plus"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canZoomIn"
          @click="source.zoomIn"
        />
      </div>
    </div>

    <!-- The pane always shows one state: the page, loading, the error, or no preview yet. -->
    <div class="relative min-h-0 flex-1 bg-elevated">
      <!-- Downloading the PDF is what unblocks approval here, so it is the main action. -->
      <div
        v-if="error || (!image && !loading)"
        class="absolute inset-0 flex items-center justify-center overflow-auto p-4"
        role="status"
      >
        <UEmpty
          icon="lucide:file-warning"
          :title="error ? 'PDF preview unavailable' : 'No PDF preview yet'"
          description="Download the source PDF and compare it with the workbook."
          variant="naked"
          :actions="[
            {
              label: 'Download PDF',
              icon: 'lucide:download',
              disabled: busy,
              loading: downloading === 'source',
              onClick: () => actions.download('source'),
            },
            {
              label: 'Retry preview',
              icon: 'lucide:refresh-cw',
              color: 'neutral',
              variant: 'outline',
              loading,
              onClick: source.retry,
            },
          ]"
        />
      </div>
      <div
        v-else-if="loading && !image"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted"
        role="status"
      >
        <UIcon
          name="lucide:loader-circle"
          class="size-6 animate-spin"
        />
        {{ pageCount ? `Loading page ${page} of ${pageCount}…` : 'Loading PDF…' }}
      </div>
      <div
        v-show="!error && image"
        ref="viewport"
        class="absolute inset-0 overflow-auto p-3"
        :tabindex="image ? 0 : undefined"
        :aria-busy="loading"
        aria-label="Original TechPack PDF preview"
      >
        <!-- The image decodes in place; a spinner sits over it until it shows. -->
        <div
          v-if="loading && image"
          class="absolute inset-0 z-10 flex items-center justify-center bg-elevated/70 text-sm text-muted"
          role="status"
        >
          <UIcon
            name="lucide:loader-circle"
            class="size-6 animate-spin"
          />
          <span class="sr-only">Loading PDF…</span>
        </div>
        <img
          v-if="image && !error"
          :key="image.page"
          :src="image.src"
          :data-page="image.page"
          :alt="`Original TechPack PDF, page ${image.page}`"
          :style="{ width: zoom + '%' }"
          class="max-w-none bg-white shadow-sm"
          draggable="false"
          @load="reportImage($event, 'shown')"
          @error="reportImage($event, 'failed')"
        >
      </div>
    </div>
  </section>
</template>
