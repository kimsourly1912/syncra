<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'

const { source, actions } = useReviewDetail()
const { preview, page, zoom, viewport, loading, error, showPage, zoomIn, zoomOut, markImageFailed } = source
const { busy } = actions
</script>

<template>
  <div class="flex min-w-0 flex-col">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-default px-4 py-2.5">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="lucide:file-text"
          class="size-5 text-primary"
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
    </div>
    <div
      v-if="preview"
      class="flex flex-wrap items-center justify-between gap-1 border-b border-default bg-default px-3 py-1"
    >
      <div class="flex items-center gap-1">
        <UButton
          aria-label="Previous PDF page"
          icon="lucide:chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="loading || page <= 1"
          @click="showPage(page - 1)"
        />
        <span
          aria-live="polite"
          class="min-w-20 text-center text-sm text-muted"
        >Page {{ page }} of {{ preview.pageCount }}</span>
        <UButton
          aria-label="Next PDF page"
          icon="lucide:chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="loading || page >= preview.pageCount"
          @click="showPage(page + 1)"
        />
      </div>
      <div class="flex items-center gap-1">
        <UButton
          aria-label="Zoom out PDF"
          icon="lucide:minus"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="zoom <= 100"
          @click="zoomOut"
        />
        <span class="min-w-10 text-center text-sm text-muted">{{ zoom === 100 ? 'Fit' : zoom + '%' }}</span>
        <UButton
          aria-label="Zoom in PDF"
          icon="lucide:plus"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="zoom >= 250"
          @click="zoomIn"
        />
      </div>
    </div>
    <div
      v-if="loading || error"
      class="border-b border-default px-4 py-2 text-sm text-muted"
      role="status"
    >
      {{ loading ? 'Loading PDF…' : error }}
    </div>
    <div class="relative min-h-[22rem] flex-1 bg-elevated lg:min-h-[29rem]">
      <div
        v-if="preview"
        ref="viewport"
        class="absolute inset-0 overflow-auto p-3"
        tabindex="0"
        aria-label="Original TechPack PDF preview"
      >
        <img
          :src="`data:image/png;base64,${preview.pngBase64}`"
          :alt="`Original TechPack PDF, page ${page}`"
          :style="{ width: zoom + '%' }"
          class="max-w-none bg-white shadow-sm"
          draggable="false"
          @error="markImageFailed"
        >
      </div>
    </div>
  </div>
</template>
