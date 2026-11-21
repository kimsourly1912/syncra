<script setup lang="ts">
import type { BaseRes } from '@/types/dto/base.dto'
import type { ReviewItem, ReviewStatus } from '@/types/dto/techpack-review.dto'

definePageMeta({ middleware: 'auth' })

interface ReviewPage {
  content: ReviewItem[]
  totalPages: number
}

const nuxtApp = useNuxtApp()
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
    const { data } = await nuxtApp.runWithContext(() => useAPI<BaseRes<ReviewPage>>('/admin/docai/techpack-reviews', {
      query: { status: status.value, page: page.value },
      signal: request.signal,
    }))
    if (request.signal.aborted) return
    items.value = data.content
    totalPages.value = data.totalPages
    if (!items.value.length && page.value > 0) {
      await navigateTo({ path: '/techpack-reviews', query: queueQuery(status.value, Math.max(0, data.totalPages - 1)) }, { replace: true })
    }
  }
  catch (error) {
    if (request.signal.aborted) return
    const response = error as { data?: { reason?: string, detail?: string, msg?: string } }
    listError.value = response?.data?.reason || response?.data?.detail || response?.data?.msg || 'Could not load TechPack reviews.'
  }
  finally {
    if (!request.signal.aborted) loading.value = false
  }
}

function queueQuery(nextStatus: ReviewStatus, nextPage: number) {
  return {
    status: nextStatus === 'REVIEWED' ? 'reviewed' : undefined,
    page: nextPage > 0 ? String(nextPage) : undefined,
  }
}

function showStatus(next: ReviewStatus) {
  return navigateTo({ path: '/techpack-reviews', query: queueQuery(next, 0) })
}

function showPage(next: number) {
  return navigateTo({ path: '/techpack-reviews', query: queueQuery(status.value, next) })
}

watch([status, page], load)
onMounted(load)
onBeforeUnmount(() => listRequest?.abort())
</script>

<template>
  <section class="max-w-5xl space-y-5">
    <h1 class="text-2xl font-semibold text-highlighted">
      TechPack reviews
    </h1>

    <div class="flex flex-wrap gap-2">
      <UButton
        label="In Review"
        :variant="status === 'IN_REVIEW' ? 'solid' : 'outline'"
        :disabled="loading"
        @click="showStatus('IN_REVIEW')"
      />
      <UButton
        label="Reviewed"
        :variant="status === 'REVIEWED' ? 'solid' : 'outline'"
        :disabled="loading"
        @click="showStatus('REVIEWED')"
      />
      <UButton
        label="Refresh"
        icon="lucide:refresh-cw"
        color="neutral"
        variant="ghost"
        :loading="loading"
        @click="load"
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
            :to="{ path: '/techpack-reviews/' + item.fileId, query: page ? { page: String(page) } : {} }"
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
        :disabled="loading || page === 0"
        @click="showPage(page - 1)"
      />
      <span class="text-sm text-muted">Page {{ page + 1 }} of {{ totalPages }}</span>
      <UButton
        label="Next"
        variant="outline"
        :disabled="loading || page + 1 >= totalPages"
        @click="showPage(page + 1)"
      />
    </div>
  </section>
</template>
