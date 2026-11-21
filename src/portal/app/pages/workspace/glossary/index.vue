<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'
import { useDebounceFn } from '@vueuse/core'
import * as glossaryService from '@/services/glossary.service'
import GlossaryUploadModal from '@/features/glossary/components/GlossaryUploadModal.vue'
import GlossaryScopePicker from '@/features/glossary/components/GlossaryScopePicker.vue'
import GlossaryCountStrip from '@/features/glossary/components/GlossaryCountStrip.vue'
import {
  canRevertGlossaryUpload,
  glossaryLayerColor,
  glossaryScopeQuery,
  glossaryStatusColor,
  triggerBlobDownload,
} from '@/features/glossary/utils/glossary'

type GlossaryView = 'entries' | 'history'

const { t, locale } = useI18n()
const { toast } = useAppToast()
const route = useRoute()
const profileStore = useProfileStore()

const activeView = shallowRef<GlossaryView>('entries')
const scopeMode = shallowRef<'company' | 'brand'>('company')
const brand = shallowRef('')
const search = shallowRef('')
const entriesPage = shallowRef(0)
const historyPage = shallowRef(0)
const entries = shallowRef<GlossaryDTO.GlossaryPage<GlossaryDTO.GlossaryEntry> | null>(null)
const history = shallowRef<GlossaryDTO.GlossaryPage<GlossaryDTO.GlossaryPreview> | null>(null)
const featureUnavailable = shallowRef(false)
const uploadModalOpen = shallowRef(false)

const pending = reactive({
  entries: false,
  history: false,
  revertId: -1,
  template: false,
})

const canManage = computed(() => profileStore.isAdmin)
const scopeReady = computed(() => scopeMode.value === 'company' || brand.value.trim().length > 0)
const selectedScope = computed(() => glossaryScopeQuery(scopeMode.value, brand.value))

const navigationItems = computed<Array<{ value: GlossaryView, label: string, icon: string }>>(() => [
  { value: 'entries', label: t('glossary.tabs.entries'), icon: 'lucide:languages' },
  { value: 'history', label: t('glossary.tabs.history'), icon: 'lucide:history' },
])

const dateTimeFormatter = computed(() => new Intl.DateTimeFormat(
  locale.value === 'zh' ? 'zh-CN' : 'en-US',
  { dateStyle: 'medium', timeStyle: 'short' },
))

function formatDate(value: string | null) {
  return value ? dateTimeFormatter.value.format(new Date(value)) : '—'
}

function scopeLabel(scope: GlossaryDTO.GlossaryScope) {
  return scope.brand
    ? t('glossary.scope.brandValue', { brand: scope.brand })
    : t('glossary.scope.company')
}

function layerLabel(layer: GlossaryDTO.GlossaryLayer) {
  if (layer === 'COMPANY_BRAND') return t('glossary.layers.companyBrand')
  if (layer === 'COMPANY_WIDE') return t('glossary.layers.companyWide')
  return t('glossary.layers.global')
}

function statusLabel(status: GlossaryDTO.GlossaryUploadStatus) {
  if (status === 'APPLIED') return t('glossary.status.applied')
  if (status === 'SUPERSEDED') return t('glossary.status.superseded')
  if (status === 'DISCARDED') return t('glossary.status.discarded')
  return t('glossary.status.preview')
}

function errorStatus(error: unknown) {
  const candidate = error as { statusCode?: number, status?: number }
  return candidate.statusCode ?? candidate.status
}

async function loadEntries() {
  if (!scopeReady.value) return
  pending.entries = true
  try {
    const response = await glossaryService.getEntries(
      { companyId: profileStore.companyId },
      {
        ...selectedScope.value,
        q: search.value.trim() || undefined,
        page: entriesPage.value,
        size: 50,
      },
    )
    entries.value = response.data
    featureUnavailable.value = false
  }
  catch (error) {
    if (errorStatus(error) === 403) {
      featureUnavailable.value = true
      entries.value = null
      return
    }
    toast.addException(error)
  }
  finally {
    pending.entries = false
  }
}

async function loadHistory() {
  if (!scopeReady.value) return
  pending.history = true
  try {
    const response = await glossaryService.getHistory(
      { companyId: profileStore.companyId },
      { ...selectedScope.value, page: historyPage.value, size: 20 },
    )
    history.value = response.data
  }
  catch (error) {
    if (errorStatus(error) === 403) {
      featureUnavailable.value = true
      history.value = null
      return
    }
    toast.addException(error)
  }
  finally {
    pending.history = false
  }
}

async function refreshCurrentView() {
  if (activeView.value === 'history') await loadHistory()
  else await loadEntries()
}

const debouncedEntries = useDebounceFn(() => {
  entriesPage.value = 0
  loadEntries()
}, 300)

watch(search, () => {
  if (activeView.value === 'entries') debouncedEntries()
})

watch(activeView, async (view) => {
  if (view === 'entries' && !entries.value) await loadEntries()
  if (view === 'history' && !history.value) await loadHistory()
})

watch([scopeMode, brand], async () => {
  entriesPage.value = 0
  historyPage.value = 0
  entries.value = null
  history.value = null
  if (scopeReady.value) await refreshCurrentView()
})

watch(entriesPage, loadEntries)
watch(historyPage, loadHistory)

async function revertUpload(uploadId: number) {
  pending.revertId = uploadId
  try {
    const response = await glossaryService.revertUpload({
      companyId: profileStore.companyId,
      uploadId,
    })
    toast.add('info', {
      title: t('glossary.toast.revertTitle'),
      description: t('glossary.toast.revertDescription'),
    })
    await openPreview(response.data.uploadId)
  }
  catch (error) {
    toast.addException(error)
  }
  finally {
    pending.revertId = -1
  }
}

async function downloadTemplate() {
  if (!canManage.value) return
  pending.template = true
  try {
    const result = await glossaryService.downloadTemplate({ companyId: profileStore.companyId })
    triggerBlobDownload(result.blob, result.filename)
  }
  catch (error) {
    toast.addException(error)
  }
  finally {
    pending.template = false
  }
}

function openUpload() {
  if (canManage.value) uploadModalOpen.value = true
}

function openPreview(uploadId: number) {
  return navigateTo(toRoute('/workspace/glossary', `/uploads/${uploadId}`))
}

function previousEntriesPage() {
  entriesPage.value -= 1
}

function nextEntriesPage() {
  entriesPage.value += 1
}

function previousHistoryPage() {
  historyPage.value -= 1
}

function nextHistoryPage() {
  historyPage.value += 1
}

useHead({ titleTemplate: `${t('glossary.title')} - %s` })

onMounted(async () => {
  await loadEntries()
  if (route.query.upload === '1') openUpload()
})
</script>

<template>
  <UDashboardPanel id="glossary-workbench">
    <template #header>
      <LayoutHeader
        :to="toRoute('/workspace')"
        :title="t('common.back')"
      />
    </template>

    <template #body>
      <LayoutContent>
        <section class="glossary-hero relative isolate overflow-hidden rounded-[1.75rem] border border-primary/15 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div class="pointer-events-none absolute -right-4 -top-12 select-none text-[10rem] font-black leading-none text-primary/[0.055] sm:text-[14rem]">
            术语
          </div>
          <div class="relative max-w-3xl">
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="subtle"
                icon="lucide:sparkles"
                :label="t('glossary.eyebrow')"
              />
              <span class="font-mono text-xs uppercase tracking-[0.18em] text-muted">POM · EN / 简体中文</span>
            </div>
            <h1 class="max-w-2xl text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
              {{ t('glossary.title') }}
            </h1>
            <p class="mt-3 max-w-2xl text-base leading-7 text-muted">
              {{ t('glossary.description') }}
            </p>
            <div
              v-if="canManage"
              class="mt-6 flex flex-wrap gap-3"
            >
              <UButton
                icon="lucide:download"
                color="neutral"
                variant="outline"
                :label="t('glossary.actions.template')"
                :loading="pending.template"
                @click="downloadTemplate"
              />
              <UButton
                icon="lucide:upload-cloud"
                :label="t('glossary.actions.newUpload')"
                @click="openUpload"
              />
            </div>
          </div>
        </section>

        <UAlert
          v-if="featureUnavailable"
          color="neutral"
          variant="subtle"
          icon="lucide:lock-keyhole"
          :title="t('glossary.unavailable.title')"
          :description="t('glossary.unavailable.description')"
        />

        <template v-else>
          <section class="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside class="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <nav class="rounded-2xl border border-default bg-default p-2 shadow-sm">
                <button
                  v-for="item in navigationItems"
                  :key="item.value"
                  type="button"
                  class="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition"
                  :class="activeView === item.value
                    ? 'bg-primary text-inverted shadow-sm'
                    : 'text-muted hover:bg-elevated hover:text-highlighted'"
                  @click="activeView = item.value"
                >
                  <span
                    class="grid size-8 place-items-center rounded-lg transition"
                    :class="activeView === item.value ? 'bg-white/15' : 'bg-elevated group-hover:bg-default'"
                  >
                    <UIcon
                      :name="item.icon"
                      class="size-4"
                    />
                  </span>
                  {{ item.label }}
                </button>
              </nav>

              <GlossaryScopePicker
                v-model:mode="scopeMode"
                v-model:brand="brand"
              />
            </aside>

            <main class="min-w-0 space-y-5">
              <template v-if="activeView === 'entries'">
                <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <LayoutHeading
                    :title="t('glossary.entries.title')"
                    :description="t('glossary.entries.description')"
                  />
                  <UInput
                    v-model="search"
                    icon="lucide:search"
                    :placeholder="t('glossary.entries.search')"
                    class="w-full sm:w-80"
                  />
                </header>

                <UAlert
                  v-if="!scopeReady"
                  color="warning"
                  variant="subtle"
                  icon="lucide:tag"
                  :title="t('glossary.scope.brandRequiredTitle')"
                  :description="t('glossary.scope.brandRequiredDescription')"
                />

                <section
                  v-else
                  class="overflow-hidden rounded-2xl border border-default bg-default shadow-sm"
                >
                  <div class="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] gap-4 border-b border-default bg-elevated/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:px-5">
                    <span>{{ t('glossary.entries.english') }}</span>
                    <span>{{ t('glossary.entries.chinese') }}</span>
                    <span class="hidden sm:block">{{ t('glossary.entries.layer') }}</span>
                  </div>

                  <div
                    v-if="pending.entries"
                    class="space-y-1 p-2"
                  >
                    <div
                      v-for="index in 8"
                      :key="index"
                      class="grid grid-cols-[1.25fr_1fr_auto] gap-4 px-3 py-3"
                    >
                      <USkeleton class="h-5" />
                      <USkeleton class="h-5" />
                      <USkeleton class="hidden h-5 w-24 sm:block" />
                    </div>
                  </div>

                  <EmptyData
                    v-else-if="!entries?.content.length"
                    icon="lucide:languages"
                    :title="t('glossary.entries.emptyTitle')"
                    :description="t('glossary.entries.emptyDescription')"
                    class="m-6"
                  />

                  <div
                    v-else
                    class="divide-y divide-default"
                  >
                    <article
                      v-for="entry in entries.content"
                      :key="`${entry.layer}-${entry.normalizedKey}`"
                      class="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4 px-4 py-4 transition hover:bg-elevated/35 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] sm:px-5"
                    >
                      <div class="min-w-0">
                        <p class="font-medium text-highlighted">
                          {{ entry.englishText }}
                        </p>
                        <p class="mt-1 truncate font-mono text-[11px] text-muted">
                          {{ entry.normalizedKey }}
                        </p>
                      </div>
                      <p class="text-base text-highlighted">
                        {{ entry.chineseText }}
                      </p>
                      <div class="col-span-2 flex items-center sm:col-span-1 sm:justify-end">
                        <UBadge
                          :color="glossaryLayerColor(entry.layer)"
                          variant="subtle"
                          :label="layerLabel(entry.layer)"
                        />
                      </div>
                    </article>
                  </div>

                  <footer
                    v-if="entries && entries.totalPages > 1"
                    class="flex items-center justify-between gap-3 border-t border-default bg-elevated/40 px-4 py-3"
                  >
                    <span class="text-sm text-muted">
                      {{ t('glossary.pagination.page', { current: entries.number + 1, total: entries.totalPages }) }}
                    </span>
                    <div class="flex gap-2">
                      <UButton
                        icon="lucide:chevron-left"
                        color="neutral"
                        variant="outline"
                        :disabled="entries.first || pending.entries"
                        :aria-label="t('glossary.pagination.previous')"
                        @click="previousEntriesPage"
                      />
                      <UButton
                        icon="lucide:chevron-right"
                        color="neutral"
                        variant="outline"
                        :disabled="entries.last || pending.entries"
                        :aria-label="t('glossary.pagination.next')"
                        @click="nextEntriesPage"
                      />
                    </div>
                  </footer>
                </section>
              </template>

              <template v-else>
                <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <LayoutHeading
                    :title="t('glossary.history.title')"
                    :description="t('glossary.history.description')"
                  />
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="lucide:refresh-cw"
                    :label="t('glossary.actions.refresh')"
                    :loading="pending.history"
                    @click="loadHistory"
                  />
                </header>

                <UAlert
                  v-if="!scopeReady"
                  color="warning"
                  variant="subtle"
                  icon="lucide:tag"
                  :title="t('glossary.scope.brandRequiredTitle')"
                  :description="t('glossary.scope.brandRequiredDescription')"
                />

                <section
                  v-else
                  class="space-y-3"
                >
                  <template v-if="pending.history">
                    <USkeleton
                      v-for="index in 5"
                      :key="index"
                      class="h-28 rounded-2xl"
                    />
                  </template>

                  <EmptyData
                    v-else-if="!history?.content.length"
                    icon="lucide:history"
                    :title="t('glossary.history.emptyTitle')"
                    :description="t('glossary.history.emptyDescription')"
                    class="rounded-2xl border border-dashed border-default py-10"
                  />

                  <template v-else>
                    <article
                      v-for="item in history?.content ?? []"
                      :key="item.uploadId"
                      class="rounded-2xl border border-default bg-default p-4 shadow-sm transition hover:border-primary/25 sm:p-5"
                    >
                      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="truncate font-semibold text-highlighted">
                              {{ item.originalFilename }}
                            </p>
                            <UBadge
                              :color="glossaryStatusColor(item.status)"
                              variant="subtle"
                              :label="statusLabel(item.status)"
                            />
                            <UBadge
                              color="neutral"
                              variant="outline"
                              :label="scopeLabel(item.scope)"
                            />
                          </div>
                          <p class="mt-2 text-sm text-muted">
                            #{{ item.uploadId }} · {{ formatDate(item.appliedDate ?? item.createdDate) }}
                            <template v-if="item.revertedFromUploadId">
                              · {{ t('glossary.history.revertedFrom', { id: item.revertedFromUploadId }) }}
                            </template>
                          </p>
                        </div>
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <GlossaryCountStrip
                            :counts="item.counts"
                            compact
                            class="min-w-0 sm:min-w-[28rem]"
                          />
                          <UButton
                            v-if="canManage && canRevertGlossaryUpload(item.status)"
                            color="neutral"
                            variant="outline"
                            icon="lucide:history"
                            :label="t('glossary.actions.revert')"
                            :loading="pending.revertId === item.uploadId"
                            @click="revertUpload(item.uploadId)"
                          />
                        </div>
                      </div>
                    </article>
                  </template>

                  <footer
                    v-if="history && history.totalPages > 1"
                    class="flex items-center justify-between gap-3 pt-2"
                  >
                    <span class="text-sm text-muted">
                      {{ t('glossary.pagination.page', { current: history.number + 1, total: history.totalPages }) }}
                    </span>
                    <div class="flex gap-2">
                      <UButton
                        icon="lucide:chevron-left"
                        color="neutral"
                        variant="outline"
                        :disabled="history.first || pending.history"
                        :aria-label="t('glossary.pagination.previous')"
                        @click="previousHistoryPage"
                      />
                      <UButton
                        icon="lucide:chevron-right"
                        color="neutral"
                        variant="outline"
                        :disabled="history.last || pending.history"
                        :aria-label="t('glossary.pagination.next')"
                        @click="nextHistoryPage"
                      />
                    </div>
                  </footer>
                </section>
              </template>
            </main>
          </section>
        </template>
      </LayoutContent>

      <GlossaryUploadModal
        v-if="canManage"
        v-model:open="uploadModalOpen"
        @preview-ready="openPreview"
      />
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.glossary-hero {
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--ui-primary) 11%, transparent), transparent 58%),
    radial-gradient(circle at 88% 20%, color-mix(in srgb, var(--ui-primary) 12%, transparent), transparent 30%),
    var(--ui-bg);
}

.glossary-hero::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  opacity: 0.22;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ui-primary) 16%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ui-primary) 16%, transparent) 1px, transparent 1px);
  background-size: 28px 28px;
}
</style>
