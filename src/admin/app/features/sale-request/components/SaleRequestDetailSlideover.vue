<script setup lang="ts">
import { useSaleRequestDetail } from '../composables/useSaleRequestDetail'
import type { SaleRequestRow } from '../models/sale-request'
import { SALE_REQUEST_SOURCE, SALE_REQUEST_STATUS, SALE_REQUEST_TYPE } from '../utils/labels'

const props = defineProps<{
  /** The request to show; none closes the panel. */
  id: number | undefined
  /** Its list row, when it's on the page, so the header shows before the detail loads. */
  row?: SaleRequestRow
}>()

const emit = defineEmits<{ close: [] }>()

const { data: detail, loading, error, pending, refresh } = useSaleRequestDetail(() => props.id)

// The detail's summary first, then the list row while it loads.
const summary = computed(() => {
  const s = detail.value?.summary
  const row = props.row?.id === props.id ? props.row : undefined
  return {
    code: s?.requestCode ?? row?.requestCode ?? (props.id === undefined ? '' : `#${props.id}`),
    name: s?.requestedByName ?? row?.userName,
    email: s?.emailAddress ?? row?.emailAddress,
    type: s?.requestedType ?? row?.requestType,
    source: s?.source ?? row?.source,
    status: s?.requestStatus ?? row?.status,
    submitted: s?.submittedAt ?? row?.submitDate,
  }
})

const status = computed(() => (summary.value.status ? SALE_REQUEST_STATUS[summary.value.status] : undefined))
const type = computed(() => (summary.value.type ? SALE_REQUEST_TYPE[summary.value.type] : undefined))
const submitted = computed(() => formatAge(summary.value.submitted))

const facts = computed(() => [
  { label: 'Requested by', value: summary.value.name },
  { label: 'Email address', value: summary.value.email },
  { label: 'Source', value: summary.value.source && SALE_REQUEST_SOURCE[summary.value.source] },
  { label: 'Submitted', value: submitted.value.full },
])

const modules = computed(() => detail.value?.moduleItems ?? [])
const tokens = computed(() => detail.value?.tokenAmount)
const seats = computed(() => detail.value?.additionalSeats)
const hasItems = computed(() => modules.value.length > 0 || tokens.value != null || seats.value != null)
</script>

<template>
  <USlideover
    :open="id !== undefined"
    :ui="{ content: 'max-w-lg' }"
    @update:open="(open) => !open && emit('close')"
  >
    <template #title>
      <span class="flex flex-wrap items-center gap-2">
        {{ summary.code }}
        <UBadge
          v-if="status"
          :label="status.label"
          :color="status.color"
          variant="subtle"
        />
      </span>
    </template>
    <template #description>
      <span
        v-if="type"
        class="inline-flex items-center gap-1.5"
      >
        <UIcon
          :name="type.icon"
          class="size-4"
          aria-hidden="true"
        />
        {{ type.label }} request
      </span>
      <span v-else>Sale request</span>
    </template>

    <template #body>
      <div class="space-y-6">
        <DetailGrid
          :items="facts"
        />

        <AlertApiError
          v-if="error"
          :error="error"
          title="Could not load this sale request"
          :retrying="pending"
          @retry="refresh"
        />

        <div
          v-else-if="loading"
          role="status"
          aria-label="Loading request details…"
          class="space-y-3"
        >
          <span class="sr-only">Loading request details…</span>
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-4 w-1/2" />
        </div>

        <template v-else-if="detail">
          <section aria-labelledby="sale-request-message">
            <h3
              id="sale-request-message"
              class="text-sm font-medium text-highlighted"
            >
              Customer message
            </h3>
            <p
              v-if="detail.summary?.customerMessage"
              class="mt-2 rounded-md border border-default bg-elevated/50 p-3 text-sm whitespace-pre-line wrap-anywhere"
            >
              {{ detail.summary.customerMessage }}
            </p>
            <p
              v-else
              class="mt-2 text-sm text-muted"
            >
              No message.
            </p>
          </section>

          <section aria-labelledby="sale-request-items">
            <h3
              id="sale-request-items"
              class="text-sm font-medium text-highlighted"
            >
              Requested
            </h3>
            <p
              v-if="!hasItems"
              class="mt-2 text-sm text-muted"
            >
              No items in this request.
            </p>
            <ul
              v-else
              class="mt-2 divide-y divide-default rounded-md border border-default"
            >
              <li
                v-for="(item, index) in modules"
                :key="item.id ?? index"
                class="space-y-2 p-3"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="lucide:blocks"
                    class="size-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span class="font-medium text-highlighted">{{ item.moduleName || item.moduleCode || 'Module' }}</span>
                  <span
                    v-if="item.moduleName && item.moduleCode"
                    class="text-xs text-dimmed"
                  >{{ item.moduleCode }}</span>
                </div>
                <div
                  v-if="item.requestedFeatures?.length"
                  class="flex flex-wrap gap-1.5 ps-6"
                >
                  <UBadge
                    v-for="feature in item.requestedFeatures"
                    :key="feature"
                    :label="feature"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  />
                </div>
              </li>
              <li
                v-if="tokens != null"
                class="flex items-center justify-between gap-2 p-3"
              >
                <span class="flex items-center gap-2">
                  <UIcon
                    name="lucide:coins"
                    class="size-4 text-muted"
                    aria-hidden="true"
                  />
                  Tokens
                </span>
                <span class="font-medium text-highlighted tabular-nums">{{ formatCount(tokens) }}</span>
              </li>
              <li
                v-if="seats != null"
                class="flex items-center justify-between gap-2 p-3"
              >
                <span class="flex items-center gap-2">
                  <UIcon
                    name="lucide:users"
                    class="size-4 text-muted"
                    aria-hidden="true"
                  />
                  Additional seats
                </span>
                <span class="font-medium text-highlighted tabular-nums">{{ formatCount(seats) }}</span>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </template>

    <!-- What approving, rejecting, or completing does, and who may, isn't specified (open question). -->
    <template #footer>
      <p class="flex items-center gap-2 text-sm text-muted">
        <UIcon
          name="lucide:info"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        Approving and rejecting requests isn't available in Admin yet.
      </p>
    </template>
  </USlideover>
</template>
