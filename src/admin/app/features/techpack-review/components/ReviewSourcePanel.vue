<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { source, actions } = useReviewDetail()
const { image, page, pageCount, zoom, loading, error, canZoomIn, canZoomOut } = source
const { busy } = actions

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

    <div class="relative min-h-96 flex-1 bg-elevated @min-[72rem]:min-h-0">
      <div
        v-if="error"
        class="space-y-2 p-4 text-sm text-muted"
      >
        <p role="status">
          PDF preview unavailable. Download the source PDF to compare it.
        </p>
        <UButton
          label="Retry PDF preview"
          color="neutral"
          variant="outline"
          size="sm"
          @click="source.retry"
        />
      </div>
      <div
        v-show="!error"
        ref="viewport"
        class="absolute inset-0 overflow-auto p-3"
        :tabindex="image ? 0 : undefined"
        :aria-busy="loading"
        aria-label="Original TechPack PDF preview"
      >
        <p
          v-if="loading"
          class="p-1 text-sm text-muted"
          role="status"
        >
          Loading PDF…
        </p>
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
