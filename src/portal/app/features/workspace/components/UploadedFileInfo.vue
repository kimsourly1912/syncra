<script setup lang="ts">
import type { DocAIDTO } from '@/types/dto'
import { humanFileSize } from '@/utils/common'

type UploadFile = File | DocAIDTO.JobFile

const props = withDefaults(defineProps<{
  show?: {
    success?: boolean
    delete?: boolean
  }
  files: UploadFile[]
  loadingFileIds?: Set<number>
  deleteDisabled?: boolean
}>(), {
  show() {
    return {
      success: true,
      delete: true,
    }
  },
})

defineEmits<{
  delete: [file: UploadFile, idx: number]
}>()

function fileKey(file: UploadFile) {
  return 'fileId' in file ? `uploaded-${file.fileId}` : `${file.lastModified}-${file.name}`
}

function fileName(file: UploadFile) {
  return 'originalFilename' in file ? file.originalFilename : file.name
}

function fileSize(file: UploadFile) {
  return 'sizeBytes' in file ? file.sizeBytes : file.size
}

function fileDocType(file: UploadFile) {
  return 'docType' in file ? file.docType : undefined
}

function invoiceRemovalFailed(file: UploadFile) {
  return 'status' in file && file.docType === 'INVOICE' && file.status === 'FAILED'
}

function isFileLoading(file: UploadFile) {
  if ('fileId' in file) {
    return props.loadingFileIds?.has(file.fileId) ?? false
  }
  return false
}
</script>

<template>
  <li
    v-for="(o, idx) in files"
    :key="fileKey(o)"
    class="p-4 bg-white dark:bg-elevated/50 flex items-center justify-between gap-4 border border-default transition-all rounded-lg"
  >
    <section class="flex items-center gap-4 flex-1">
      <div class="rounded-lg bg-blue-100 p-2.5 flex items-center justify-center text-blue-500">
        <UIcon
          name="lucide:file"
          class="w-6 h-6"
        />
      </div>

      <section class="space-y-1 flex-1">
        <div class="flex items-center justify-between">
          <h1 class="text-highlighted font-medium break-all text-base">
            {{ fileName(o) }}
          </h1>

          <template v-if="show.delete">
            <UButton
              icon="lucide:trash-2"
              color="error"
              variant="ghost"
              class="rounded-lg"
              :loading="isFileLoading(o)"
              :disabled="deleteDisabled"
              :aria-label="invoiceRemovalFailed(o) ? 'Retry removing invoice set' : fileDocType(o) === 'INVOICE' ? 'Remove invoice set' : undefined"
              @click="$emit('delete', o, idx)"
            />
          </template>
        </div>

        <p
          v-for="attachment in ('fileId' in o ? o.attachments : [])"
          :key="attachment.role"
          class="break-all text-sm text-highlighted"
        >
          {{ attachment.originalFilename }}
        </p>

        <div class="flex items-center gap-6 text-sm">
          <span class="text-muted">{{ humanFileSize(fileSize(o)) }}</span>

          <div
            v-if="show.success && !invoiceRemovalFailed(o)"
            class="flex items-center gap-1.5"
          >
            <div class="bg-success rounded-full p-0.5 flex items-center justify-center">
              <UIcon
                class="text-white w-3 h-3"
                name="lucide:check"
              />
            </div>
            <span class="text-muted">Uploaded successfully</span>
          </div>

          <UBadge
            v-if="fileDocType(o)"
            size="xs"
            variant="soft"
            color="info"
            :label="fileDocType(o)"
          />
        </div>
      </section>
    </section>
  </li>
</template>
