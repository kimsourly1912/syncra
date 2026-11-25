<script setup lang="ts">
import { useLeadDetail } from '../composables/useLeadDetail'
import type { LeadRow } from '../models/lead'
import { LEAD_STATUS } from '../utils/status'

const props = defineProps<{
  /** The lead to show; none closes the panel. */
  id: number | undefined
  /** Its list row, when it's on the page, so the header shows before the detail loads. */
  row?: LeadRow
}>()

const emit = defineEmits<{ close: [] }>()

const { data: detail, loading, error, pending, refresh } = useLeadDetail(() => props.id)

// The detail first, then the list row while it loads.
const lead = computed(() => {
  const d = detail.value
  const row = props.row?.id === props.id ? props.row : undefined
  return {
    code: d?.inquiryCode ?? row?.inquiryCode ?? (props.id === undefined ? '' : `#${props.id}`),
    name: d?.fullName ?? row?.fullName,
    company: d?.companyName ?? row?.companyName,
    email: d?.workEmail ?? row?.workEmail,
    phone: d?.phoneNumber ?? row?.phoneNumber,
    status: d?.status ?? row?.status,
  }
})

const status = computed(() => (lead.value.status ? LEAD_STATUS[lead.value.status] : undefined))

const contact = computed(() => [
  { label: 'Name', value: lead.value.name || '—' },
  { label: 'Company', value: lead.value.company || '—' },
  { label: 'Work email', value: lead.value.email || '—' },
  { label: 'Phone number', value: lead.value.phone || '—' },
])

const agreed = (value: boolean | null | undefined) => (value == null ? '—' : value ? 'Yes' : 'No')

const company = computed(() => [
  { label: 'Country', value: detail.value?.country || '—' },
  { label: 'Company size', value: detail.value?.companySize || '—' },
  { label: 'Industry', value: detail.value?.industryType || '—' },
  { label: 'Agreed to be contacted', value: agreed(detail.value?.agreedToContact) },
])

/** The products and modules the lead picked, named once each. */
const interests = computed(() => {
  const names = [
    ...(detail.value?.interestedProduct ?? []),
    ...(detail.value?.modules ?? []).map(module => module.name || module.code),
  ].filter((name): name is string => !!name)
  return [...new Set(names)]
})
</script>

<template>
  <USlideover
    :open="id !== undefined"
    :ui="{ content: 'max-w-lg' }"
    @update:open="(open) => !open && emit('close')"
  >
    <template #title>
      <span class="flex flex-wrap items-center gap-2">
        {{ lead.name || 'Unnamed lead' }}
        <UBadge
          v-if="status"
          :label="status.label"
          :color="status.color"
          variant="subtle"
        />
      </span>
    </template>
    <template #description>
      {{ [lead.code, lead.company].filter(Boolean).join(' · ') }}
    </template>

    <template #body>
      <div class="space-y-6">
        <section aria-labelledby="lead-contact">
          <h3
            id="lead-contact"
            class="text-sm font-medium text-highlighted"
          >
            Contact
          </h3>
          <dl class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              v-for="fact in contact"
              :key="fact.label"
              class="min-w-0"
            >
              <dt class="text-sm text-muted">
                {{ fact.label }}
              </dt>
              <dd class="mt-0.5 wrap-anywhere text-highlighted">
                {{ fact.value }}
              </dd>
            </div>
          </dl>
        </section>

        <AlertApiError
          v-if="error"
          :error="error"
          title="Could not load this lead"
          :retrying="pending"
          @retry="refresh"
        />

        <div
          v-else-if="loading"
          role="status"
          aria-label="Loading lead details…"
          class="space-y-3"
        >
          <span class="sr-only">Loading lead details…</span>
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-4 w-1/2" />
        </div>

        <template v-else-if="detail">
          <section aria-labelledby="lead-interest">
            <h3
              id="lead-interest"
              class="text-sm font-medium text-highlighted"
            >
              Interested in
            </h3>
            <div
              v-if="interests.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="name in interests"
                :key="name"
                :label="name"
                color="neutral"
                variant="soft"
              />
            </div>
            <p
              v-else
              class="mt-2 text-sm text-muted"
            >
              Nothing picked.
            </p>
          </section>

          <section aria-labelledby="lead-goals">
            <h3
              id="lead-goals"
              class="text-sm font-medium text-highlighted"
            >
              Goals
            </h3>
            <p
              v-if="detail.mainGoals"
              class="mt-2 rounded-md border border-default bg-elevated/50 p-3 text-sm whitespace-pre-line wrap-anywhere"
            >
              {{ detail.mainGoals }}
            </p>
            <p
              v-else
              class="mt-2 text-sm text-muted"
            >
              No goals given.
            </p>
            <p
              v-if="detail.documentTypes"
              class="mt-2 text-sm"
            >
              <span class="text-muted">Documents:</span> {{ detail.documentTypes }}
            </p>
          </section>

          <section aria-labelledby="lead-company">
            <h3
              id="lead-company"
              class="text-sm font-medium text-highlighted"
            >
              Company
            </h3>
            <dl class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                v-for="fact in company"
                :key="fact.label"
                class="min-w-0"
              >
                <dt class="text-sm text-muted">
                  {{ fact.label }}
                </dt>
                <dd class="mt-0.5 wrap-anywhere text-highlighted">
                  {{ fact.value }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            v-if="detail.reason"
            aria-labelledby="lead-reason"
          >
            <h3
              id="lead-reason"
              class="text-sm font-medium text-highlighted"
            >
              Status note
            </h3>
            <p class="mt-2 text-sm whitespace-pre-line wrap-anywhere">
              {{ detail.reason }}
            </p>
          </section>
        </template>
      </div>
    </template>

    <!-- The status change endpoint's rules and permissions aren't confirmed (open question). -->
    <template #footer>
      <p class="flex items-center gap-2 text-sm text-muted">
        <UIcon
          name="lucide:info"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        Changing a lead's status isn't available in Admin yet.
      </p>
    </template>
  </USlideover>
</template>
