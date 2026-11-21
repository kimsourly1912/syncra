<script setup lang="ts">
import type { DocAIDTO } from '@/types/dto'
import * as docaiService from '@/services/docai.service'
import { downloadBlob, humanFileSize } from '@/utils/common'
import * as XLSX from 'xlsx'
import type { NuxtUIColor } from '~/types/nuxt-ui'
import { useObjectUrl } from '@vueuse/core'

const props = defineProps<{
  loading?: boolean
  item: DocAIDTO.JobResultData
}>()

const emit = defineEmits<{
  fileDeleted: [fileId: number]
}>()

const { toast } = useAppToast()
const profileStore = useProfileStore()

// Preview modal state
const previewOpen = ref(false)
const previewFilename = ref('')
const previewSheets = ref<string[]>([])
const activeSheet = ref('')
const sheetData = ref<Record<string, string[][]>>({})
const sheetMerges = ref<Record<string, XLSX.Range[]>>({})
const previewLoading = ref(false)

// Delete confirmation state
const deleteConfirmOpen = ref(false)
const fileToDelete = ref<DocAIDTO.JobFileResult | null>(null)
const deleteLoading = ref(false)

const currentSheetData = computed(() => sheetData.value[activeSheet.value] || [])

// Calculate the maximum number of columns across all rows to ensure consistent cell rendering
const maxColumns = computed(() => {
  const data = currentSheetData.value
  if (!data.length) return 0
  return Math.max(...data.map(row => row.length))
})

// Normalize rows to have consistent column count (fill missing cells with empty strings)
const normalizedSheetData = computed(() => {
  const data = currentSheetData.value
  const colCount = maxColumns.value
  if (!colCount) return data
  return data.map((row) => {
    if (row.length >= colCount) return row
    const normalized = [...row]
    while (normalized.length < colCount) {
      normalized.push('')
    }
    return normalized
  })
})

// Detect the actual header row index: first row where majority (>50%) of cells have non-empty values
const headerRowIndex = computed(() => {
  const data = normalizedSheetData.value
  const colCount = maxColumns.value
  if (!colCount || !data.length) return 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row) continue
    const nonEmpty = row.filter(cell => cell !== '' && cell != null).length
    // Header row should have content in most columns (at least 50%)
    if (nonEmpty >= Math.max(3, colCount * 0.5)) {
      return i
    }
  }
  return 0
})

// Build a set of merged cell positions (row-col) for the current sheet
const mergedCells = computed(() => {
  const merges = sheetMerges.value[activeSheet.value] || []
  const merged = new Set<string>()
  for (const range of merges) {
    // range: { s: { r, c }, e: { r, c } }
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        if (r !== range.s.r || c !== range.s.c) {
          // Mark non-origin cells of the merge as merged (to be hidden)
          merged.add(`${r}:${c}`)
        }
      }
    }
  }
  return merged
})

// Get colspan for a cell (if it's the origin of a merge)
function getCellColspan(rowIndex: number, colIndex: number): number {
  const merges = sheetMerges.value[activeSheet.value] || []
  for (const range of merges) {
    if (range.s.r === rowIndex && range.s.c === colIndex) {
      return range.e.c - range.s.c + 1
    }
  }
  return 1
}

// Check if a cell should be hidden (it's a non-origin part of a merge)
function isMergedHidden(rowIndex: number, colIndex: number): boolean {
  return mergedCells.value.has(`${rowIndex}:${colIndex}`)
}

const statusMap: Record<string, { color: NuxtUIColor, icon: string, border: string }> = {
  DRAFT: { color: 'neutral', icon: 'lucide:file-edit', border: 'border-l-neutral-500' },
  PENDING: { color: 'info', icon: 'lucide:clock', border: 'border-l-info-500' },
  PROCESSING: { color: 'info', icon: 'lucide:loader', border: 'border-l-info-500' },
  COMPLETED: { color: 'success', icon: 'lucide:circle-check', border: 'border-l-success-500' },
  PARTIAL_COMPLETED: { color: 'warning', icon: 'lucide:alert-triangle', border: 'border-l-warning-500' },
  FAILED: { color: 'error', icon: 'lucide:alert-triangle', border: 'border-l-error-500' },
  REJECTED: { color: 'error', icon: 'lucide:alert-triangle', border: 'border-l-error-500' },
}

const defaultStatus = { color: 'info' as const, icon: 'lucide:clock', border: 'border-l-info-500' }

function getFileStatus(file: DocAIDTO.JobFileResult) {
  if (file.deleted) return statusMap.DRAFT
  if (file.verificationPending) return statusMap.PROCESSING
  if (file.errorMessage) return statusMap.FAILED
  if (file.status && statusMap[file.status]) return statusMap[file.status]
  if (file.extractedData) return statusMap.COMPLETED
  return statusMap[props.item.status] ?? defaultStatus
}

async function onPreview(file: DocAIDTO.JobFileResult) {
  const path = file.excelDownloadUrl
  if (!path)
    return

  previewLoading.value = true
  previewOpen.value = true
  previewFilename.value = file.originalFilename || file.excelFilename || 'Excel Preview'

  try {
    const { file } = await useFileAPI(path)
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Parse all sheets (preserving merge information)
    const sheets: Record<string, string[][]> = {}
    const merges: Record<string, XLSX.Range[]> = {}
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      if (worksheet) {
        sheets[sheetName] = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '', raw: false })
        merges[sheetName] = worksheet['!merges'] || []
      }
    }

    previewSheets.value = workbook.SheetNames
    sheetData.value = sheets
    sheetMerges.value = merges
    activeSheet.value = workbook.SheetNames[0] || ''
  }
  catch (e) {
    toast.addException(e)
    previewOpen.value = false
  }
  finally {
    previewLoading.value = false
  }
}

const fileActionLoading = ref<Record<number, boolean>>({})
const erpExportErrors = ref<Record<number, string | undefined>>({})

function canExportFileToErp(file: DocAIDTO.JobFileResult) {
  return profileStore.canExportToErp && file.docType === 'TECHPACK'
}

async function exportToERP(params: DocAIDTO.FileParam, combined: boolean) {
  try {
    await docaiService.exportFileToERP(params)
    erpExportErrors.value[params.fileId] = undefined
    toast.add('success', {
      title: combined ? 'Download & Export Successful' : 'ERP Export Successful',
      description: combined
        ? 'Excel download started and the file has been exported to ERP.'
        : 'File has been exported to ERP system.',
    })
  }
  catch (e) {
    const error = e as { data?: { detail?: string, reason?: string } }
    const message = error?.data?.detail || error?.data?.reason || 'ERP export failed. Please verify in ERP before retrying.'
    erpExportErrors.value[params.fileId] = message
    toast.add('error', {
      title: 'ERP Export Failed',
      description: `Excel download started. ${message}`,
    })
  }
}

async function onDownload(file: DocAIDTO.JobFileResult) {
  const fileId = file.fileId
  if (file.deleted || fileActionLoading.value[fileId])
    return

  const path = file.excelDownloadUrl
  if (!path) {
    toast.add('warning', { title: 'Failed', description: 'File not found!' })
    return
  }

  // Capture the selection before awaiting the download, which may outlast a company switch.
  const exportParams = canExportFileToErp(file)
    ? { companyId: profileStore.companyId, jobId: props.item.jobId, fileId }
    : null
  fileActionLoading.value[fileId] = true
  try {
    const { file: blob, fileName } = await useFileAPI(path)
    const fName = fileName === 'unknown' ? file.excelFilename || 'docai' : fileName
    downloadBlob(blob, fName)
    if (exportParams)
      await exportToERP(exportParams, true)
  }
  catch (e) {
    toast.addException(e)
  }
  finally {
    fileActionLoading.value[fileId] = false
  }
}

async function onRetryErpExport(file: DocAIDTO.JobFileResult) {
  const fileId = file.fileId
  if (!canExportFileToErp(file) || !file.excelDownloadUrl || file.deleted || fileActionLoading.value[fileId])
    return

  fileActionLoading.value[fileId] = true
  try {
    await exportToERP({
      companyId: profileStore.companyId,
      jobId: props.item.jobId,
      fileId,
    }, false)
  }
  finally {
    fileActionLoading.value[fileId] = false
  }
}

function confirmDelete(file: DocAIDTO.JobFileResult) {
  fileToDelete.value = file
  deleteConfirmOpen.value = true
}

async function onDeleteFile() {
  if (!fileToDelete.value) return

  deleteLoading.value = true
  const fileId = fileToDelete.value.fileId
  try {
    await docaiService.softDeleteFile({
      companyId: profileStore.companyId,
      jobId: props.item.jobId,
      fileId,
    })
    // Update local state for immediate reactivity
    const file = props.item.files.find(f => f.fileId === fileId)
    if (file) {
      file.deleted = true
      file.excelDownloadUrl = null
      file.excelPreviewUrl = null
    }
    toast.add('success', { title: 'File Deleted', description: 'The file has been deleted.' })
    emit('fileDeleted', fileId)
  }
  catch (e) {
    toast.addException(e)
  }
  finally {
    deleteLoading.value = false
    deleteConfirmOpen.value = false
    fileToDelete.value = null
  }
}

async function onPreviewPDF(file: DocAIDTO.JobFileResult) {
  const path = file.sourceDownloadUrl
  if (!path) {
    toast.add('error', { title: 'Failed', description: 'No file url provided!' })
    return
  }

  try {
    const { file } = await useFileAPI(path)
    const url = useObjectUrl(file)
    window.open(url.value, '_blank')
  }
  catch {
    toast.add('error', { title: 'Failed', description: 'Internal server error!' })
  }
}
</script>

<template>
  <div>
    <section v-if="loading">
      <UCard>
        <section class="flex items-center gap-4">
          <UIcon
            name="app:loading"
            class="size-5 text-primary"
          />
          <span class="text-muted">Fetching extracted data...</span>
        </section>
      </UCard>
    </section>
    <section v-else-if="!item.files.length">
      <EmptyData description="No data available for this extraction job." />
    </section>
    <ul
      v-else
      class="space-y-6"
    >
      <li
        v-for="file in item.files"
        :key="file.fileId"
        :class="['p-4 bg-elevated/50 ring ring-default transition-all rounded-lg border-l-2', file.deleted ? 'border-l-neutral-400 opacity-75' : getFileStatus(file)?.border]"
      >
        <section class="flex justify-between items-start gap-4 flex-wrap">
          <section class="flex items-start flex-wrap gap-2">
            <UBadge
              :icon="getFileStatus(file)?.icon"
              :color="getFileStatus(file)?.color"
              size="xl"
              variant="subtle"
            />

            <section class="space-y-1">
              <div class="flex items-center flex-wrap gap-2">
                <h1 class="text-highlighted break-all">
                  {{ file.excelFilename || file.originalFilename }}
                </h1>
                <UBadge
                  variant="outline"
                  size="xs"
                  color="info"
                  :label="file.docType"
                />
                <UBadge
                  v-if="file.verificationPending"
                  variant="subtle"
                  size="xs"
                  color="info"
                  label="Verifying your document"
                />
                <UBadge
                  v-if="file.deleted"
                  variant="solid"
                  size="xs"
                  color="error"
                  label="Deleted"
                />
              </div>
              <div class="text-sm text-muted">
                File Size:
                <span class="text-info underline">{{ humanFileSize(file.sizeBytes || 0) }}</span>
              </div>
              <div class="text-sm text-muted">
                Source:
                <NuxtLink
                  class="text-info underline break-all cursor-pointer"
                  external
                  @click="onPreviewPDF(file)"
                >
                  {{ file.originalFilename }}
                </NuxtLink>
                <!-- <span class="text-info underline break-all">{{ file.originalFilename }}</span> -->
              </div>
            </section>
          </section>

          <div class="text-muted text-sm flex items-center gap-4 flex-wrap">
            Token Consumed:
            <div class="font-semibold flex items-center gap-3">
              <LogoBadge src="img/coin.png" />
              <span class="text-highlighted">{{ file.creditsCharged ?? 'N/A' }}</span>
            </div>
          </div>
        </section>

        <section
          v-if="file.excelDownloadUrl && !file.deleted"
          class="grid gap-4 mt-6"
          :class="canExportFileToErp(file) && erpExportErrors[file.fileId] ? 'md:grid-cols-4' : 'md:grid-cols-3'"
        >
          <UButton
            label="Preview"
            color="neutral"
            variant="subtle"
            icon="lucide:eye"
            block
            class="flex-1"
            :disabled="!file.excelDownloadUrl || file.deleted"
            @click="onPreview(file)"
          />
          <UButton
            :label="canExportFileToErp(file) ? 'Download & Export to ERP' : 'Download Spreadsheet'"
            color="neutral"
            variant="subtle"
            icon="lucide:download"
            block
            class="flex-1"
            :disabled="!file.excelDownloadUrl || file.deleted || fileActionLoading[file.fileId]"
            :loading="fileActionLoading[file.fileId]"
            @click="onDownload(file)"
          />
          <UButton
            v-if="canExportFileToErp(file) && erpExportErrors[file.fileId]"
            label="Retry ERP Export"
            color="neutral"
            variant="subtle"
            icon="lucide:refresh-cw"
            block
            class="flex-1"
            :disabled="!file.excelDownloadUrl || file.deleted || fileActionLoading[file.fileId]"
            :loading="fileActionLoading[file.fileId]"
            @click="onRetryErpExport(file)"
          />
          <UButton
            label="Delete"
            color="error"
            variant="subtle"
            icon="lucide:trash-2"
            block
            class="flex-1"
            :disabled="!file.excelDownloadUrl || file.deleted || fileActionLoading[file.fileId]"
            @click="confirmDelete(file)"
          />
        </section>

        <section
          v-if="canExportFileToErp(file) && erpExportErrors[file.fileId] && !file.deleted"
          role="alert"
          class="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm"
        >
          Excel download started. ERP export failed: {{ erpExportErrors[file.fileId] }}
        </section>

        <!-- Error Message Display -->
        <section
          v-if="file.errorMessage"
          class="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg"
        >
          <div class="flex items-start gap-2 text-error">
            <UIcon
              name="lucide:alert-circle"
              class="size-5 shrink-0 mt-0.5"
            />
            <p class="text-sm">
              {{ file.errorMessage }}
            </p>
          </div>
        </section>
      </li>
    </ul>

    <!-- Excel Preview Modal -->
    <UModal
      v-model:open="previewOpen"
      :title="previewFilename"
      class="max-w-9xl"
    >
      <template #body>
        <div
          v-if="previewLoading"
          class="flex items-center justify-center py-12"
        >
          <UIcon
            name="app:loading"
            class="size-8 text-primary"
          />
          <span class="ml-3 text-muted">Loading spreadsheet...</span>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <!-- Sheet Tabs -->
          <div
            v-if="previewSheets.length > 1"
            class="flex gap-2 flex-wrap border-b border-default pb-2"
          >
            <UButton
              v-for="sheet in previewSheets"
              :key="sheet"
              :label="sheet"
              :variant="activeSheet === sheet ? 'solid' : 'ghost'"
              :color="activeSheet === sheet ? 'primary' : 'neutral'"
              size="sm"
              @click="activeSheet = sheet"
            />
          </div>

          <!-- Data Table -->
          <div class="overflow-auto max-h-[60vh] border border-default rounded-lg">
            <table class="min-w-full text-sm">
              <tbody>
                <tr
                  v-for="(row, rowIndex) in normalizedSheetData"
                  :key="rowIndex"
                  :class="[
                    rowIndex === headerRowIndex ? 'bg-elevated font-semibold sticky top-0 z-10' : '',
                    rowIndex < headerRowIndex ? 'bg-elevated/30 text-muted' : '',
                    rowIndex > headerRowIndex ? 'hover:bg-elevated/50' : '',
                  ]"
                >
                  <template v-for="(cell, colIndex) in row" :key="colIndex">
                    <td
                      v-if="!isMergedHidden(rowIndex, colIndex)"
                      :colspan="getCellColspan(rowIndex, colIndex)"
                      class="px-3 py-2 border-b border-r border-default whitespace-nowrap"
                    >
                      {{ cell ?? '' }}
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>

            <div
              v-if="!currentSheetData.length"
              class="p-8 text-center text-muted"
            >
              No data in this sheet
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          label="Close"
          color="neutral"
          variant="outline"
          @click="previewOpen = false"
        />
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="deleteConfirmOpen"
      title="Delete File"
      class="max-w-3xl"
    >
      <template #body>
        <p class="text-muted">
          Are you sure you want to delete <strong>{{ fileToDelete?.originalFilename }}</strong>?
        </p>
        <p class="text-sm text-warning mt-2">
          This action will permanently remove the file from storage. The file info will remain visible in history but cannot be previewed or downloaded.
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="deleteConfirmOpen = false"
          />
          <UButton
            label="Delete"
            color="error"
            :loading="deleteLoading"
            @click="onDeleteFile"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
