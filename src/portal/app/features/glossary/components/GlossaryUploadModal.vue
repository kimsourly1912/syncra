<script setup lang="ts">
import type { GlossaryDTO } from '@/types/dto'
import * as glossaryService from '@/services/glossary.service'
import GlossaryIssues from '@/features/glossary/components/GlossaryIssues.vue'
import GlossaryScopePicker from '@/features/glossary/components/GlossaryScopePicker.vue'
import { glossaryScopeQuery, previewFromUploadError, stashGlossaryPreview } from '@/features/glossary/utils/glossary'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  previewReady: [uploadId: number]
}>()

const { t } = useI18n()
const { toast } = useAppToast()
const profileStore = useProfileStore()

const scopeMode = shallowRef<'company' | 'brand'>('company')
const brand = shallowRef('')
const selectedFile = shallowRef<File | null>(null)
const pending = shallowRef(false)

const scopeReady = computed(() => scopeMode.value === 'company' || brand.value.trim().length > 0)
const selectedScope = computed(() => glossaryScopeQuery(scopeMode.value, brand.value))

const clientIssues = computed<GlossaryDTO.GlossaryIssue[]>(() => {
  if (!selectedFile.value) return []
  const issues: GlossaryDTO.GlossaryIssue[] = []

  if (!selectedFile.value.name.toLowerCase().endsWith('.xlsx')) {
    issues.push({
      severity: 'BLOCKING',
      rowNumbers: [],
      message: t('glossary.upload.xlsxOnly'),
    })
  }

  if (selectedFile.value.size > 5 * 1024 * 1024) {
    issues.push({
      severity: 'BLOCKING',
      rowNumbers: [],
      message: t('glossary.upload.tooLarge'),
    })
  }

  return issues
})

function reset() {
  scopeMode.value = 'company'
  brand.value = ''
  selectedFile.value = null
  pending.value = false
}

function closeModal() {
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen && !pending.value) reset()
})

async function createPreview() {
  if (!selectedFile.value || !scopeReady.value || clientIssues.value.length) return
  pending.value = true

  try {
    const response = await glossaryService.uploadGlossary(
      { companyId: profileStore.companyId },
      selectedFile.value,
      selectedScope.value,
    )
    open.value = false
    emit('previewReady', response.data.uploadId)
  }
  catch (error) {
    const rejectedPreview = previewFromUploadError(error)
    if (rejectedPreview) {
      stashGlossaryPreview(rejectedPreview)
      open.value = false
      emit('previewReady', rejectedPreview.uploadId)
      return
    }
    toast.addException(error)
  }
  finally {
    pending.value = false
    if (!open.value) reset()
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('glossary.upload.modalTitle')"
    :description="t('glossary.upload.description')"
    class="max-w-2xl"
    :dismissible="!pending"
  >
    <template #body>
      <div class="space-y-5">
        <GlossaryScopePicker
          v-model:mode="scopeMode"
          v-model:brand="brand"
          :disabled="pending"
        />

        <UFileUpload
          v-model="selectedFile"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          size="xl"
          layout="list"
          icon="lucide:file-spreadsheet"
          :label="t('glossary.upload.dropLabel')"
          :description="t('glossary.upload.dropDescription')"
          :disabled="pending"
          class="glossary-dropzone"
        />

        <GlossaryIssues
          v-if="clientIssues.length"
          :blocking-errors="clientIssues"
        />

        <p class="flex items-center gap-2 text-xs text-muted">
          <UIcon
            name="lucide:shield-check"
            class="size-4 text-primary"
          />
          {{ t('glossary.upload.previewPromise') }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.cancel')"
          :disabled="pending"
          @click="closeModal"
        />
        <UButton
          icon="lucide:scan-search"
          :label="t('glossary.upload.previewAction')"
          :disabled="!selectedFile || !scopeReady || clientIssues.length > 0"
          :loading="pending"
          @click="createPreview"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.glossary-dropzone {
  --ui-radius: 1rem;
}
</style>
