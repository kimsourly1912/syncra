<script setup lang="ts">
import * as docaiService from '@/services/docai.service'
import ExtractionFileInfo from '~/features/workspace/components/ExtractionFileInfo.vue'
import ExtractionFileProcessing from '~/features/workspace/components/ExtractionFileProcessing.vue'
import { humanFormatSeconds, humanFileSize, dateFormatter, msToTimeParts, formatPid } from '@/utils/common'
import type { DocAIDTO } from '@/types/dto'
import { activityMap } from '@/features/workspace/data/workspace.data'

interface ProcessingDetailItem {
  label: string
  value: string
  type: 'expiry' | 'text' | 'token'
}

interface OpenItem {
  delete: boolean
}

interface PendingItem {
  delete: boolean
}

const route = useRoute()
const { toast } = useAppToast()
const profileStore = useProfileStore()

const id = route.params.id as string
const from = route.query.from as '/workspace' | '/workspace/activity-history'

const { data: activityData, pending: activityPending, execute: activityExecute } = useAsyncData('activity-history-detail', async () => {
  const { data } = await docaiService.getJobResult({ companyId: profileStore.companyId, jobId: +id })
  return data
}, { lazy: true })

const open = reactive<OpenItem>({
  delete: false,
})

const pending = reactive<PendingItem>({
  delete: false,
})

const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)

const verificationPending = computed(() => activityData.value?.files.some(file => file.verificationPending) ?? false)
const activityValue = computed(() => verificationPending.value
  ? { ...activityMap.PROCESSING, label: 'Verifying your document' }
  : activityMap[activityData.value?.status ?? 'DRAFT'])
// Only show skeletons on the first load — not on background poll refreshes
const initialLoading = computed(() => activityPending.value && !activityData.value)
// --- Polling for in-progress jobs ---
const isProcessing = computed(() => {
  const s = activityData.value?.status
  return s === 'PROCESSING' || s === 'PENDING'
})

const shouldPoll = computed(() => isProcessing.value || verificationPending.value)

function usageDetails(job: DocAIDTO.JobResultData): ProcessingDetailItem[] {
  const { totalCreditsCharged, extractionMethod, actualTokens } = job
  if (job.docType !== 'INVOICE') {
    return [{ type: 'token', label: 'Token Usage:', value: totalCreditsCharged ? String(totalCreditsCharged) : 'N/A' }]
  }

  const methodNames = { GEMINI: 'GenAI', RULE_BASED: 'Rule-based' }
  const methodLabel = extractionMethod ? methodNames[extractionMethod] : null
  const modelTokens = extractionMethod === 'RULE_BASED' ? 0 : actualTokens
  // Older invoice results can include a price estimate before the worker records a debit.
  const legacyEstimate = extractionMethod === undefined
    && (job.status === 'DRAFT' || job.status === 'PENDING' || job.status === 'PROCESSING')
  const charged = legacyEstimate ? undefined : totalCreditsCharged
  return [
    { type: 'text', label: 'Extraction method:', value: methodLabel ?? 'Unavailable' },
    { type: 'text', label: 'Model tokens (this attempt):', value: String(modelTokens ?? 'Unavailable') },
    { type: 'token', label: 'Syncra credits charged:', value: String(charged ?? 'Unavailable') },
  ]
}

const processingDetails = computed(() => {
  if (!activityData.value) return []
  const { jobId, displayId, processedBy, docType, totalSizeBytes, processingDurationMs, processingStartedDate, status, filesExpireAt, filesDeleted } = activityData.value
  const { totalSeconds } = msToTimeParts(processingDurationMs || 0)
  const statuses: DocAIDTO.DocAIJobStatus[] = ['COMPLETED', 'FAILED', 'REJECTED']
  const showRetention = statuses.includes(status) && !filesDeleted

  const retentionItem = (showRetention
    ? filesExpireAt
      ? {
          type: 'expiry',
          label: 'File Expiry:',
          value: dateFormatter.format(new Date(filesExpireAt)),
        }
      : {
          type: 'expiry',
          label: 'File Retention:',
          value: 'No automatic deletion',
        }
    : null) satisfies ProcessingDetailItem | null

  return [
    {
      type: 'text',
      label: 'Processing ID:',
      value: formatPid(displayId, jobId),
    },
    {
      type: 'text',
      label: 'Processed By:',
      value: processedBy,
    },
    {
      type: 'text',
      label: 'Module:',
      value: docType,
    },
    ...usageDetails(activityData.value),
    {
      type: 'text',
      label: 'File Size:',
      value: humanFileSize(totalSizeBytes || 0),
    },
    {
      type: 'text',
      label: 'Processing Time:',
      value: humanFormatSeconds(totalSeconds),
    },
    {
      type: 'text',
      label: 'Process Start Date:',
      value: dateTimeFormatter.format(new Date(processingStartedDate || 0)),
    },
    retentionItem,
  ] satisfies (ProcessingDetailItem | null)[]
})

const alertMessage = computed(() => {
  if (!activityData.value) return
  // use object-like type in case the UI requires icon or value ...
  const messageMap: Partial<Record<DocAIDTO.DocAIJobStatus, { label: string }>> = {
    FAILED: {
      label: 'Process failed and files have been deleted. No data is available.',
    },
    COMPLETED: {
      label: 'Extracted Files have been deleted. Extracted datas are no longer available!',
    },
    REJECTED: {
      label: 'Process rejected and files have been deleted. No data is available.',
    },
  }
  return messageMap[activityData.value.status]
})

async function onBulkDeleteFile() {
  pending.delete = true
  try {
    await docaiService.bulkDeleteJobFiles({ companyId: profileStore.companyId, jobId: +id })
    await activityExecute()
    open.delete = false
    toast.add('success', { title: 'Success', description: 'Successfully deleted files' })
  }
  catch (e) {
    toast.addException(e)
  }
  finally {
    pending.delete = false
  }
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

async function poll() {
  if (activityPending.value) return
  await activityExecute()
  if (!shouldPoll.value) {
    stopPolling()
    // Refresh balance when job reaches a terminal state
    profileStore.refreshBalance()
  }
}

async function onFileDeleted() {
  await activityExecute()
}

watch(shouldPoll, (processing) => {
  if (processing && !pollingTimer.value) {
    pollingTimer.value = setInterval(poll, 3000)
  }
  else if (!processing) {
    stopPolling()
  }
}, { immediate: true })

onBeforeUnmount(() => stopPolling())
</script>

<template>
  <UDashboardPanel id="activity-history-details">
    <template #header>
      <LayoutHeader
        :to="toRoute(from ?? '/workspace/activity-history')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent>
        <header class="flex items-center justify-between gap-4 flex-wrap">
          <template v-if="initialLoading">
            <USkeleton class="h-6 w-36" />
            <USkeleton class="h-6 w-36" />
          </template>

          <template v-else>
            <section class="flex flex-wrap items-center gap-4">
              <LayoutHeading
                :title="formatPid(activityData?.displayId, activityData?.jobId)"
              />
              <UBadge
                v-bind="activityValue"
                variant="outline"
              />
            </section>

            <template v-if="!activityData?.filesDeleted && activityData?.status !== 'PROCESSING'">
              <UButton
                label="Delete"
                icon="lucide:trash-2"
                color="error"
                @click="open.delete = true"
              />
            </template>
          </template>
        </header>

        <LayoutWrapper title="Processing Details">
          <UCard>
            <template v-if="initialLoading">
              <ul class="grid sm:grid-cols-2 gap-y-6 gap-x-10">
                <li
                  v-for="i in 7"
                  :key="i"
                  class="flex justify-between gap-4 flex-wrap pb-2.5 border-b border-default last:border-none"
                >
                  <USkeleton class="h-6 w-36" />
                  <USkeleton class="h-6 w-24" />
                </li>
              </ul>
            </template>
            <template v-else>
              <template v-if="processingDetails.length > 0">
                <ul class="grid sm:grid-cols-2 gap-y-6 gap-x-10">
                  <template
                    v-for="(o, idx) in processingDetails"
                    :key="idx"
                  >
                    <li
                      v-if="o"
                      class="flex justify-between gap-4 md:flex-row flex-col pb-2.5 border-b border-default"
                    >
                      <span>{{ o.label }}</span>

                      <template v-if="o.type === 'token'">
                        <div class="flex items-center gap-2">
                          <LogoBadge src="img/coin.png" />
                          <span class="text-muted">{{ o.value }}</span>
                        </div>
                      </template>

                      <template v-else-if="o.type === 'expiry'">
                        <div class="flex items-center gap-2">
                          <span class="text-muted">{{ o.value }}</span>
                          <UIcon
                            name="lucide:info"
                            class="text-warning"
                          />
                        </div>
                      </template>

                      <template v-else>
                        <span class="text-muted">{{ o.value }}</span>
                      </template>
                    </li>
                  </template>
                </ul>
              </template>
              <template v-else>
                <EmptyData
                  variant="naked"
                  :ui="{ root: tw`sm:p-0 lg:p-0` }"
                />
              </template>
            </template>
          </UCard>
        </LayoutWrapper>

        <LayoutWrapper title="Extracting Details">
          <template v-if="initialLoading">
            <section class="space-y-6">
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-40"
              />
            </section>
          </template>

          <template v-else>
            <template v-if="activityData">
              <template v-if="activityData.status === 'PROCESSING'">
                <ExtractionFileProcessing
                  :label-id="formatPid(activityData.displayId, +id)"
                  :job-id="+id"
                  :status="activityData.status"
                  :progress="activityData.processingDurationMs"
                  :estimated-seconds="activityData.totalEstimatedSeconds"
                  :error-message="activityData.errorMessage"
                />
              </template>
              <template v-else>
                <template v-if="activityData.filesDeleted">
                  <UAlert
                    :title="alertMessage?.label"
                    icon="lucide:info"
                    color="error"
                    variant="subtle"
                  />
                </template>
                <template v-else>
                  <template v-if="activityData.files.length > 0">
                    <ExtractionFileInfo
                      :item="activityData"
                      @file-deleted="onFileDeleted"
                    />
                  </template>
                  <template v-else>
                    <EmptyData />
                  </template>
                </template>
              </template>
            </template>

            <template v-else>
              <EmptyData />
            </template>
          </template>
        </LayoutWrapper>
      </LayoutContent>

      <ModalConfirmation
        v-model="open.delete"
        icon="lucide:info"
        color="error"
        title="Remove file from this Process?"
        description="You are about to remove this file! Processing details will remain the same."
        label-right="Remove"
        :loading="pending.delete"
        @right="onBulkDeleteFile"
      />
    </template>
  </UDashboardPanel>
</template>
