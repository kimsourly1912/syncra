<script setup lang="ts">
import type { TableColumn, TabsItem } from '@nuxt/ui'
import { useEmailTemplate, useEmailTemplates } from '../composables/useEmailTemplates'
import type { EmailTemplate } from '../models/email-template'

const { data, loading, refreshing, pending, error, refresh } = useEmailTemplates()
const templates = computed(() => data.value ?? [])

// The open template is `?template=<name>`; opening and closing replace the URL.
const route = useRoute()
const router = useRouter()
const openName = computed(() => (typeof route.query.template === 'string' && route.query.template ? route.query.template : undefined))
function setOpen(name: string | undefined) {
  const { template: _, ...query } = route.query
  return router.replace({ query: name === undefined ? query : { ...query, template: name } })
}

const detail = useEmailTemplate(openName)
const open = computed(() => detail.data.value ?? templates.value.find(t => t.name === openName.value))

const view = ref<'html' | 'text'>('html')
const views = computed<(TabsItem & { value: 'html' | 'text' })[]>(() => [
  { label: 'Email', value: 'html', icon: 'lucide:mail', disabled: !open.value?.html },
  { label: 'Plain text', value: 'text', icon: 'lucide:text', disabled: !open.value?.text },
])
watch(open, (template) => {
  view.value = template?.html ? 'html' : 'text'
})

// The name's button stretches over the row, so the whole row opens the template.
const OPEN = 'text-start font-medium wrap-anywhere text-highlighted after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary'

const columns: TableColumn<EmailTemplate>[] = [
  { id: 'name', header: 'Template' },
  { id: 'subject', header: 'Subject', meta: { class: { th: 'pr-12', td: 'pr-12' } } },
]
</script>

<template>
  <UPageCard
    title="Email templates"
    description="The emails Syncra sends to customers and staff. Open one to read it."
    variant="outline"
  >
    <AlertApiError
      v-if="error"
      :error="error"
      title="Could not load email templates"
      :retrying="pending"
      @retry="refresh"
    />
    <ListRefresh
      v-else
      :active="refreshing"
    >
      <UTable
        :data="templates"
        :columns
        :loading
        :ui="{ root: 'rounded-lg border border-default', tr: 'relative' }"
        aria-label="Email templates"
      >
        <template #name-cell="{ row }">
          <button
            type="button"
            :class="OPEN"
            @click="setOpen(row.original.name)"
          >
            <code class="text-sm">{{ row.original.name }}</code>
            <UIcon
              name="lucide:chevron-right"
              class="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </button>
        </template>
        <template #subject-cell="{ row }">
          <span class="line-clamp-2 text-muted wrap-anywhere">{{ row.original.subject || '—' }}</span>
        </template>
        <template #loading>
          <ListSkeleton label="Loading email templates…" />
        </template>
        <template #empty>
          <ListEmptyState
            noun="email templates"
            title="No email templates yet."
          />
        </template>
      </UTable>
    </ListRefresh>

    <p class="flex items-center gap-2 text-sm text-muted">
      <UIcon
        name="lucide:info"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
      Editing templates isn't available in Admin yet.
    </p>
  </UPageCard>

  <USlideover
    :open="openName !== undefined"
    :title="openName"
    :description="open?.subject || 'No subject'"
    :ui="{ content: 'max-w-2xl' }"
    @update:open="(value) => !value && setOpen(undefined)"
  >
    <template #body>
      <AlertApiError
        v-if="detail.error.value && !open"
        :error="detail.error.value"
        title="Could not load this template"
        :retrying="detail.pending.value"
        @retry="detail.refresh"
      />
      <div
        v-else-if="!open"
        role="status"
        aria-label="Loading template…"
        class="space-y-3"
      >
        <span class="sr-only">Loading template…</span>
        <USkeleton class="h-8 w-48" />
        <USkeleton class="h-72 w-full" />
      </div>
      <div
        v-else
        class="flex h-full min-h-0 flex-col gap-3"
      >
        <UTabs
          v-model="view"
          :items="views"
          :content="false"
          size="sm"
        />
        <!-- The HTML is shown sandboxed: no scripts, no forms, no navigation out of the frame. -->
        <iframe
          v-if="view === 'html' && open.html"
          :srcdoc="open.html"
          sandbox=""
          title="Email preview"
          class="min-h-96 w-full flex-1 rounded-lg border border-default bg-white"
        />
        <pre
          v-else-if="open.text"
          class="min-h-0 flex-1 overflow-auto rounded-lg border border-default bg-elevated/50 p-3 text-sm whitespace-pre-wrap wrap-anywhere"
        >{{ open.text }}</pre>
        <p
          v-else
          class="text-sm text-muted"
        >
          This template has no body.
        </p>
      </div>
    </template>
  </USlideover>
</template>
