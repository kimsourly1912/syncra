import { api } from '@/api'
import type { ReviewItem } from '../models/review-item'
import { sourcePreviewModel } from '../models/workbook-inspection'

const UNAVAILABLE = 'PDF preview unavailable. Download the source PDF to compare it.'

/** One page of the source PDF as an image, with paging and zoom. */
export function useSourcePreview(review: Readonly<Ref<ReviewItem | undefined>>) {
  const page = ref(1)
  const zoom = ref(100)
  const viewport = ref<HTMLElement | null>(null)
  const imageFailed = ref(false)

  const query = useApiQuery(
    () => `techpack-reviews:source:${review.value?.fileId}:${page.value}`,
    ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}/source-preview', {
      path: { fileId: review.value!.fileId },
      query: { page: page.value },
      signal,
      model: sourcePreviewModel,
    }),
    { enabled: () => !!review.value?.draftUuid },
  )

  // A new page starts at the top.
  watch(query.data, () => {
    imageFailed.value = false
    viewport.value?.scrollTo(0, 0)
  })

  const error = computed(() => (query.error.value || imageFailed.value ? UNAVAILABLE : ''))

  function showPage(next: number) {
    const last = query.data.value?.pageCount ?? next
    if (next >= 1 && next <= last) page.value = next
  }

  return {
    preview: query.data,
    page,
    zoom,
    viewport,
    loading: query.pending,
    error,
    /** The reviewer could see the PDF: counts toward "source accessed". */
    shown: computed(() => !!query.data.value && !error.value),
    showPage,
    zoomIn: () => (zoom.value = Math.min(250, zoom.value + 50)),
    zoomOut: () => (zoom.value = Math.max(100, zoom.value - 50)),
    /** The image itself didn't render. */
    markImageFailed: () => (imageFailed.value = true),
  }
}
