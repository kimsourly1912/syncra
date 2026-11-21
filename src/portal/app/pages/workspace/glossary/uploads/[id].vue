<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'
import * as glossaryService from '@/services/glossary.service'
import GlossaryIssues from '@/features/glossary/components/GlossaryIssues.vue'
import GlossaryDiffPanel from '@/features/glossary/components/GlossaryDiffPanel.vue'
import GlossaryCountStrip from '@/features/glossary/components/GlossaryCountStrip.vue'
import {
  glossaryErrorCode,
  glossaryStatusColor,
  readStashedGlossaryPreview,
  requiresTypedGlossaryRemovalConfirmation,
} from '@/features/glossary/utils/glossary'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { t, locale } = useI18n()
const { toast } = useAppToast()
const route = useRoute()
const profileStore = useProfileStore()

const preview = shallowRef<GlossaryDTO.GlossaryPreview | null>(null)
const loadError = shallowRef(false)
const stalePreview = shallowRef(false)
const confirmApply = shallowRef(false)
const typedRemovalCount = shallowRef('')

const pending = reactive({
  load: false,
  apply: false,
  discard: false,
})

const uploadId = computed(() => Number(route.params.id))
const canManage = computed(() => profileStore.isAdmin)
const removalCount = computed(() => preview.value?.counts.removed ?? 0)
const typedConfirmationRequired = computed(() => (
  requiresTypedGlossaryRemovalConfirmation(removalCount.value)
))
const typedConfirmationMatches = computed(() => (
  !typedConfirmationRequired.value || typedRemovalCount.value.trim() === String(removalCount.value)
))

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

async function loadPreview() {
  if (!Number.isInteger(uploadId.value) || uploadId.value <= 0) {
    loadError.value = true
    return
  }

  pending.load = true
  loadError.value = false
  const stashed = readStashedGlossaryPreview(uploadId.value)
  if (stashed?.status === 'DISCARDED') {
    preview.value = stashed
    pending.load = false
    return
  }

  try {
    const response = await glossaryService.getUpload({
      companyId: profileStore.companyId,
      uploadId: uploadId.value,
    })
    preview.value = response.data
  }
  catch (error) {
    if (stashed) {
      preview.value = stashed
      return
    }
    if (errorStatus(error) === 403 || errorStatus(error) === 404) {
      loadError.value = true
      return
    }
    toast.addException(error)
    loadError.value = true
  }
  finally {
    pending.load = false
  }
}

async function applyPreview() {
  if (!preview.value || preview.value.status !== 'PREVIEW' || preview.value.blockingErrors.length) return
  if (!typedConfirmationMatches.value) return

  confirmApply.value = false
  pending.apply = true
  try {
    const response = await glossaryService.applyUpload({
      companyId: profileStore.companyId,
      uploadId: preview.value.uploadId,
    })
    preview.value = response.data
    stalePreview.value = false
    toast.add('success', {
      title: t('glossary.toast.appliedTitle'),
      description: t('glossary.toast.appliedDescription'),
    })
  }
  catch (error) {
    if (glossaryErrorCode(error) === 'GLOSSARY_PREVIEW_STALE') {
      stalePreview.value = true
      return
    }
    toast.addException(error)
  }
  finally {
    pending.apply = false
  }
}

function requestApply() {
  if (removalCount.value === 0) {
    applyPreview()
    return
  }

  typedRemovalCount.value = ''
  confirmApply.value = true
}

async function discardPreview() {
  if (!preview.value || preview.value.status !== 'PREVIEW') return
  pending.discard = true
  try {
    await glossaryService.discardUpload({
      companyId: profileStore.companyId,
      uploadId: preview.value.uploadId,
    })
    await navigateTo(toRoute('/workspace/glossary'))
  }
  catch (error) {
    toast.addException(error)
  }
  finally {
    pending.discard = false
  }
}

async function reupload() {
  await navigateTo(toRoute('/workspace/glossary', '?upload=1'))
}

function closeApplyConfirmation() {
  confirmApply.value = false
}

useHead({ titleTemplate: `${t('glossary.preview.title')} - %s` })
onMounted(loadPreview)
</script>

<template>
  <UDashboardPanel id="glossary-preview">
    <template #header>
      <LayoutHeader
        :to="toRoute('/workspace/glossary')"
        :title="t('glossary.preview.back')"
      />
    </template>

    <template #body>
      <LayoutContent>
        <section class="preview-hero relative isolate overflow-hidden rounded-[1.75rem] border border-primary/15 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div class="pointer-events-none absolute -right-4 -top-12 select-none text-[10rem] font-black leading-none text-primary/[0.055] sm:text-[14rem]">
            校对
          </div>
          <div class="relative max-w-3xl">
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <UBadge
                color="warning"
                variant="subtle"
                icon="lucide:scan-search"
                :label="t('glossary.preview.eyebrow')"
              />
              <span class="font-mono text-xs uppercase tracking-[0.18em] text-muted">PREVIEW · #{{ uploadId }}</span>
            </div>
            <h1 class="max-w-2xl text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
              {{ t('glossary.preview.title') }}
            </h1>
            <p class="mt-3 max-w-2xl text-base leading-7 text-muted">
              {{ t('glossary.preview.description') }}
            </p>
          </div>
        </section>

        <template v-if="pending.load">
          <USkeleton class="h-28 rounded-2xl" />
          <USkeleton class="h-72 rounded-2xl" />
        </template>

        <section
          v-else-if="loadError || !preview"
          class="rounded-2xl border border-default bg-default p-6 shadow-sm"
        >
          <div class="mx-auto max-w-lg py-8 text-center">
            <div class="mx-auto grid size-12 place-items-center rounded-full bg-error/10 text-error">
              <UIcon
                name="lucide:file-question-mark"
                class="size-6"
              />
            </div>
            <h2 class="mt-4 text-lg font-semibold text-highlighted">
              {{ t('glossary.preview.notFoundTitle') }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-muted">
              {{ t('glossary.preview.notFoundDescription') }}
            </p>
            <UButton
              class="mt-5"
              color="neutral"
              variant="outline"
              icon="lucide:arrow-left"
              :label="t('glossary.preview.back')"
              :to="toRoute('/workspace/glossary')"
            />
          </div>
        </section>

        <template v-else>
          <UAlert
            v-if="stalePreview"
            color="warning"
            variant="subtle"
            icon="lucide:refresh-cw"
            :title="t('glossary.stale.title')"
            :description="t('glossary.stale.description')"
          >
            <template #actions>
              <UButton
                color="warning"
                variant="soft"
                icon="lucide:upload-cloud"
                :label="t('glossary.stale.action')"
                @click="reupload"
              />
            </template>
          </UAlert>

          <section class="rounded-2xl border border-default bg-default p-4 shadow-sm sm:p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex min-w-0 items-center gap-3">
                <div class="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UIcon
                    name="lucide:file-spreadsheet"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-highlighted">
                    {{ preview.originalFilename }}
                  </p>
                  <p class="mt-0.5 text-sm text-muted">
                    {{ scopeLabel(preview.scope) }} · {{ t('glossary.upload.rowsParsed', { count: preview.parsedRowCount }) }} · {{ formatDate(preview.createdDate) }}
                  </p>
                </div>
              </div>
              <UBadge
                :color="glossaryStatusColor(preview.status)"
                variant="subtle"
                :label="statusLabel(preview.status)"
                class="w-fit"
              />
            </div>
          </section>

          <GlossaryIssues
            :warnings="preview.warnings"
            :blocking-errors="preview.blockingErrors"
          />

          <GlossaryDiffPanel
            v-if="!stalePreview"
            :preview="preview"
          />

          <footer class="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-default bg-default/90 p-3 shadow-xl shadow-black/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <UButton
              v-if="canManage && preview.status === 'PREVIEW'"
              color="neutral"
              variant="ghost"
              icon="lucide:trash-2"
              :label="t('glossary.actions.discard')"
              :loading="pending.discard"
              @click="discardPreview"
            />
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              icon="lucide:arrow-left"
              :label="t('glossary.preview.back')"
              :to="toRoute('/workspace/glossary')"
            />

            <UButton
              v-if="canManage && preview.status === 'PREVIEW' && !preview.blockingErrors.length && !stalePreview"
              icon="lucide:check"
              :label="removalCount > 0
                ? t(
                  removalCount === 1
                    ? 'glossary.actions.applyWithRemoval'
                    : 'glossary.actions.applyWithRemovals',
                  { count: removalCount },
                )
                : t('glossary.actions.apply')"
              :loading="pending.apply"
              @click="requestApply"
            />
          </footer>
        </template>
      </LayoutContent>

      <UModal
        v-model:open="confirmApply"
        :title="t('glossary.confirm.title')"
        :description="t('glossary.confirm.removalDescription')"
        class="max-w-xl"
      >
        <template #body>
          <div
            v-if="preview"
            class="space-y-5"
          >
            <GlossaryCountStrip
              :counts="preview.counts"
              compact
            />
            <UAlert
              color="error"
              variant="subtle"
              icon="lucide:triangle-alert"
              :title="t('glossary.confirm.removalTitle', { count: removalCount })"
              :description="t('glossary.confirm.scope', { scope: scopeLabel(preview.scope) })"
            />
            <div
              v-if="typedConfirmationRequired"
              class="space-y-2"
            >
              <label
                for="glossary-removal-confirm"
                class="text-sm font-medium text-highlighted"
              >
                {{ t('glossary.confirm.typeCount', { count: removalCount }) }}
              </label>
              <UInput
                id="glossary-removal-confirm"
                v-model="typedRemovalCount"
                inputmode="numeric"
                autocomplete="off"
                :placeholder="String(removalCount)"
                class="w-full"
              />
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="closeApplyConfirmation"
            />
            <UButton
              color="error"
              icon="lucide:check"
              :label="t('glossary.actions.confirmApply')"
              :disabled="!typedConfirmationMatches"
              :loading="pending.apply"
              @click="applyPreview"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.preview-hero {
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--ui-warning) 9%, transparent), transparent 58%),
    radial-gradient(circle at 88% 20%, color-mix(in srgb, var(--ui-primary) 11%, transparent), transparent 30%),
    var(--ui-bg);
}

.preview-hero::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  opacity: 0.2;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ui-primary) 15%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ui-primary) 15%, transparent) 1px, transparent 1px);
  background-size: 28px 28px;
}
</style>
