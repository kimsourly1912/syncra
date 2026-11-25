import { api } from '@/api'
import type { ReviewDraft } from '../models/review-item'
import { sourcePreviewModel } from '../models/source-preview'

const FIT_ZOOM = 100
const MAX_ZOOM = 250
const ZOOM_STEP = 50

/** Fetches one rendered PDF page at a time and tracks whether the browser could display it. */
export function useSourcePreview(draft: Readonly<Ref<ReviewDraft | undefined>>) {
  const page = ref(1)
  const pageCount = ref(0)
  const zoom = ref(FIT_ZOOM)
  const imageStatus = ref<'loading' | 'shown' | 'failed'>('loading')

  const query = useApiQuery(
    () => `techpack-review:source:${draft.value?.fileId}:${page.value}`,
    async ({ signal }) => {
      const current = draft.value
      if (!current) return null
      const requestedPage = page.value
      const result = await api.get('/admin/docai/techpack-reviews/{fileId}/source-preview', {
        path: { fileId: current.fileId },
        query: { page: requestedPage },
        signal,
        model: sourcePreviewModel,
      })
      return { page: requestedPage, pageCount: result.pageCount, src: `data:image/png;base64,${result.pngBase64}` }
    },
    { enabled: () => !!draft.value },
  )
  const image = computed(() => {
    if (query.pending.value) return
    const preview = query.data.value
    return preview?.page === page.value ? preview : undefined
  })

  watch(image, (current) => {
    imageStatus.value = 'loading'
    if (current) pageCount.value = current.pageCount
  }, { immediate: true, flush: 'sync' })

  function showPage(next: number) {
    if (Number.isInteger(next) && next >= 1 && (!pageCount.value || next <= pageCount.value)) {
      page.value = next
    }
  }

  function reportImage(src: string, imagePage: number, status: 'shown' | 'failed') {
    if (image.value?.src === src && image.value.page === imagePage) imageStatus.value = status
  }

  function retry() {
    // A browser decode failure needs a fresh image element even when the API returns identical bytes.
    imageStatus.value = 'loading'
    return query.refresh()
  }

  return {
    image,
    page: readonly(page),
    pageCount: readonly(pageCount),
    zoom: readonly(zoom),
    loading: computed(() => query.pending.value || (!!image.value && imageStatus.value === 'loading')),
    error: computed(() => !!query.error.value || imageStatus.value === 'failed'),
    shown: computed(() => !!image.value && !query.error.value && imageStatus.value === 'shown'),
    canZoomIn: computed(() => zoom.value < MAX_ZOOM),
    canZoomOut: computed(() => zoom.value > FIT_ZOOM),
    showPage,
    zoomIn: () => { zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP) },
    zoomOut: () => { zoom.value = Math.max(FIT_ZOOM, zoom.value - ZOOM_STEP) },
    reportImage,
    retry,
  }
}
