import { errorMessage } from '@/api'
import type { ReviewItem, ReviewStatus } from '../models/review-item'
import { listReviews } from '../services/techpack-review.service'

const QUEUE_PATH = '/techpack-reviews'

function queueQuery(status: ReviewStatus, page: number) {
  return {
    status: status === 'REVIEWED' ? 'reviewed' : undefined,
    page: page > 0 ? String(page) : undefined,
  }
}

/** The review queue. Status and the zero-based page live in the URL. */
export function useReviewQueue() {
  const route = useRoute()

  const status = computed<ReviewStatus>(() => route.query.status === 'reviewed' ? 'REVIEWED' : 'IN_REVIEW')
  const page = computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value > 0 && value <= 2147483647 ? value : 0
  })
  const items = ref<ReviewItem[]>([])
  const totalPages = ref(0)
  const loading = ref(false)
  const listError = ref('')
  let listRequest: AbortController | undefined

  async function load() {
    listRequest?.abort()
    const request = new AbortController()
    listRequest = request
    loading.value = true
    listError.value = ''
    try {
      const data = await listReviews({ status: status.value, page: page.value }, request.signal)
      if (request.signal.aborted) return
      items.value = data.content
      totalPages.value = data.totalPages
      if (!items.value.length && page.value > 0) {
        await navigateTo({ path: QUEUE_PATH, query: queueQuery(status.value, Math.max(0, data.totalPages - 1)) }, { replace: true })
      }
    }
    catch (error) {
      if (request.signal.aborted) return
      listError.value = errorMessage(error, 'Could not load TechPack reviews.')
    }
    finally {
      if (!request.signal.aborted) loading.value = false
    }
  }

  function showStatus(next: ReviewStatus) {
    return navigateTo({ path: QUEUE_PATH, query: queueQuery(next, 0) })
  }

  function showPage(next: number) {
    return navigateTo({ path: QUEUE_PATH, query: queueQuery(status.value, next) })
  }

  watch([status, page], load)
  onMounted(load)
  onBeforeUnmount(() => listRequest?.abort())

  return {
    status,
    page,
    items,
    totalPages,
    loading,
    listError,
    load,
    showStatus,
    showPage,
  }
}
