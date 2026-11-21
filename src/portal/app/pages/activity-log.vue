<script setup lang="ts">
import type { ActivityLogDTO, DocAIDTO } from '@/types/dto'
import * as docaiService from '@/services/docai.service'
import * as teamManagementService from '@/services/team-management.service'
import * as activityLogService from '@/services/activity-log.service'
import * as moduleService from '@/services/module.service'
import { useInfiniteScroll } from '@vueuse/core'
import { formatPid } from '@/utils/common'

const profileStore = useProfileStore()
useBalancePolling()

const selectedUser = ref<string>('all')
const selectedModule = ref<string>('all')
const startDate = ref()
const endDate = ref()

const query = reactive({
  page: 0,
  size: 10,
})

const contentRef = useTemplateRef('content-ref')

const jobResultsCache = ref<Record<number, DocAIDTO.JobResultData>>({})
const loadingJobId = ref<number | null>(null)

const { data: teamMembersData } = useAsyncData(
  'activity-log-users',
  () => teamManagementService.getTeamMembers({ companyId: profileStore.companyId }),
  { lazy: true, server: false },
)

const { data: modulesData } = useAsyncData(
  'activity-log-modules',
  () => moduleService.getModulesAccess({ companyId: profileStore.companyId }),
  { lazy: true, server: false },
)

const userFilterOptions = computed(() => {
  const options = [{ label: 'All Users', value: 'all' }]
  const members = teamMembersData.value?.data ?? []
  members.forEach((member) => {
    options.push({
      label: member.fullName || member.email,
      value: String(member.sub),
    })
  })
  return options
})

const moduleFilterOptions = computed(() => {
  const options = [{ label: 'All Applications', value: 'all' }]
  const modules = modulesData.value?.data ?? []
  modules.forEach((mod) => {
    options.push({
      label: mod.moduleName,
      value: String(mod.moduleId),
    })
  })
  return options
})

function parseDateValue(date: unknown): Date | null {
  if (!date) return null
  if (typeof date === 'object' && date !== null && 'year' in date && 'month' in date && 'day' in date) {
    const d = date as { year: number, month: number, day: number }
    return new Date(d.year, d.month - 1, d.day)
  }
  if (date instanceof Date) return date
  if (typeof date === 'string') return new Date(date)
  return null
}

function formatDateForApi(date: unknown): string | undefined {
  const parsed = parseDateValue(date)
  return parsed?.toISOString()
}
function formatEndDateForApi(date: unknown): string | undefined {
  const parsed = parseDateValue(date)
  if (!parsed) return undefined
  // Set to end of day (23:59:59.999)
  parsed.setHours(23, 59, 59, 999)
  return parsed.toISOString()
}

function buildFilterParams(): Record<string, string> {
  const params: Record<string, string> = {}

  if (selectedUser.value && selectedUser.value !== 'all') {
    params.actorId = selectedUser.value
  }
  if (selectedModule.value && selectedModule.value !== 'all') {
    params.moduleId = selectedModule.value
  }
  if (startDate.value) {
    const formatted = formatDateForApi(startDate.value)
    if (formatted) params.startDate = formatted
  }
  if (endDate.value) {
    const formatted = formatEndDateForApi(endDate.value)
    if (formatted) params.endDate = formatted
  }

  return params
}

async function fetchActivityLogs() {
  const filterParams = buildFilterParams()
  const params: Record<string, unknown> = {
    page: query.page,
    size: query.size,
    ...filterParams,
  }

  const response = await activityLogService.getActivityLogs({ companyId: profileStore.companyId }, params)
  return response
}

const filterDependencies = computed(() => ({
  ...query,
  user: selectedUser.value,
  module: selectedModule.value,
  start: startDate.value?.toString(),
  end: endDate.value?.toString(),
}))

const { data, pending, refresh } = useAsyncData('activity-logs', fetchActivityLogs, {
  lazy: true,
  watch: [filterDependencies],
})

const logs = computed(() => data.value?.data?.logs ?? [])
const totalElements = computed(() => data.value?.data?.totalElements ?? 0)

async function fetchJobResult(jobId: number) {
  if (jobResultsCache.value[jobId]) return

  loadingJobId.value = jobId
  try {
    const response = await docaiService.getJobResult({ companyId: profileStore.companyId, jobId })
    if (response.success) {
      jobResultsCache.value[jobId] = response.data
    }
  }
  catch (e) {
    console.error('Failed to fetch job result:', e)
  }
  finally {
    loadingJobId.value = null
  }
}

function handleCollapsibleOpen(jobId: number, isOpen: boolean) {
  if (isOpen && !jobResultsCache.value[jobId]) {
    fetchJobResult(jobId)
  }
}

const { toast } = useAppToast()

async function handleExport() {
  const params = buildFilterParams()

  try {
    const { blob, filename } = await activityLogService.exportActivityLogs({ companyId: profileStore.companyId }, params)

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'activity-logs.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.add('success', { title: 'Export Complete', description: 'Activity logs exported successfully' })
  }
  catch (e) {
    console.error('Failed to export logs:', e)
    toast.add('error', { title: 'Export Failed', description: 'Unable to export activity logs' })
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-'
  return new Intl.NumberFormat('en-US').format(num)
}

function getActorDisplayName(actor: ActivityLogDTO.ActorSnapshot): string {
  if (actor && actor.name) return actor?.name
  if (actor && actor.email) return actor.email
  return 'Unknown'
}

function getStatusColor(status: ActivityLogDTO.ActivityLogStatus | string | null | undefined): 'success' | 'error' | 'warning' {
  if (!status) return 'warning'
  switch (status) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'success'
    case 'FAILURE':
    case 'FAILED':
    case 'REJECTED':
      return 'error'
    case 'PARTIAL_COMPLETED':
    case 'PENDING':
    case 'PROCESSING':
      return 'warning'
    default:
      return 'warning'
  }
}

function getStatusLabel(status: ActivityLogDTO.ActivityLogStatus | string | null | undefined): string {
  if (!status) return 'Unknown'
  switch (status) {
    case 'SUCCESS':
      return 'Completed'
    case 'FAILURE':
      return 'Failed'
    case 'PARTIAL_COMPLETED':
      return 'Partial Completed'
    case 'PENDING':
      return 'Pending'
    default:
      return status
  }
}

interface GroupedLogs {
  date: string
  displayDate: string
  entries: ActivityLogDTO.ActivityLogEntry[]
}

const groupedLogs = computed<GroupedLogs[]>(() => {
  const groups: Record<string, ActivityLogDTO.ActivityLogEntry[]> = {}

  logs.value.forEach((log) => {
    const date = formatDate(log.createdAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(log)
  })

  const today = formatDate(new Date().toISOString())

  return Object.entries(groups).map(([date, entries]) => ({
    date,
    displayDate: date === today ? `${date} - Today` : date,
    entries,
  }))
})

onMounted(() => {
  const el = contentRef.value?.$el as HTMLElement
  useInfiniteScroll(el?.parentElement, () => {
    query.size += 20
  },
  {
    canLoadMore() {
      return query.size < totalElements.value
    },
  },
  )
})

useHead({
  titleTemplate: 'Activity Log - %s',
})
</script>

<template>
  <UDashboardPanel id="activity-log">
    <template #header>
      <LayoutHeader title="Activity Log" />
    </template>

    <template #body>
      <LayoutContent ref="content-ref">
        <LayoutWrapper
          title="Activity"
          description="Monitor user actions and system events across your Syncra workspace"
        />

        <BaseCard>
          <section class="flex items-center flex-wrap gap-4">
            <USelect
              v-model="selectedUser"
              class="flex-1 min-w-44"
              placeholder="All Users"
              :items="userFilterOptions"
              value-key="value"
            />
            <USelect
              v-model="selectedModule"
              class="flex-1 min-w-44"
              placeholder="All Applications"
              :items="moduleFilterOptions"
              value-key="value"
            />

            <UInputDate
              v-model="startDate"
              class="flex-1 min-w-44"
            >
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="lucide-calendar"
                    aria-label="Select start date"
                  />

                  <template #content>
                    <UCalendar v-model="startDate" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>

            <UInputDate
              v-model="endDate"
              class="flex-1 min-w-44"
            >
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="lucide-calendar"
                    aria-label="Select end date"
                  />

                  <template #content>
                    <UCalendar v-model="endDate" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>

            <UButton
              label="Export Log"
              icon="lucide:download"
              @click="handleExport"
            />
          </section>
        </BaseCard>

        <div
          v-if="pending && logs.length === 0"
          class="flex justify-center py-8"
        >
          <UButton
            loading
            variant="ghost"
            label="Loading..."
          />
        </div>

        <template v-if="groupedLogs.length > 0">
          <LayoutWrapper
            v-for="group in groupedLogs"
            :key="group.date"
            :title="group.displayDate"
          >
            <ActivityTimeline
              :entries="group.entries"
              size="lg"
            >
              <template #item="{ entry }">
                <LayoutWrapper
                  :title="formatTime(entry.createdAt)"
                  description=""
                >
                  <BaseCard class="mt-2 space-y-4">
                    <section class="flex items-center gap-2.5">
                      <div
                        :class="[
                          'size-10 flex items-center justify-center rounded-full overflow-hidden',
                          entry?.actor?.profilePic ? '' : 'bg-primary',
                        ]"
                      >
                        <template v-if="!entry?.actor?.profilePic">
                          <UIcon
                            name="lucide:image"
                            class="text-white text-xl"
                          />
                        </template>
                        <template v-else>
                          <NuxtImg
                            :src="(entry.actor.profilePic as string)"
                            class="size-full object-cover"
                            width="40"
                            height="40"
                          />
                        </template>
                      </div>
                      <div class="text-sm">
                        <h1 class="font-semibold">
                          {{ getActorDisplayName(entry.actor) }}
                        </h1>
                        <span class="text-muted">{{ entry?.actor?.role || '' }}</span>
                      </div>
                    </section>

                    <section class="flex items-center justify-between gap-4 flex-wrap">
                      <span class="text-highlighted text-sm">
                        <span class="font-semibold">{{ getActorDisplayName(entry.actor) }}</span>
                        processed <span class="font-semibold">{{ entry.entity?.displayName || formatPid(entry.entity?.displayId) }}</span>
                        in the <span class="font-semibold">{{ entry.entity?.processorName || entry.module?.name }}</span> module
                        <span class="font-semibold">({{ entry.module?.name }})</span>
                      </span>
                      <UBadge
                        size="lg"
                        :icon="entry.entity?.status === 'SUCCESS' ? 'lucide:circle-check' : entry.entity?.status === 'FAILURE' ? 'lucide:circle-x' : 'lucide:clock'"
                        :color="getStatusColor(entry.entity?.status)"
                        variant="outline"
                        :label="getStatusLabel(entry.entity?.status)"
                      />
                    </section>
                    <section class="flex items-center justify-between gap-4 flex-wrap ">
                      <div>
                        <span class="text-muted text-sm">Processed at: <span class="text-highlighted">{{ formatDateTime(entry.entity?.finishedAt || entry.createdAt) }}</span></span>
                      </div>

                      <div
                        v-if="entry.entity?.creditsCharged"
                        class="flex items-center gap-4 flex-wrap text-sm"
                      >
                        <span class="text-muted">Token Usage:</span>
                        <div class="flex items-center gap-3">
                          <LogoBadge src="img/coin.png" />
                          <span class="text-highlighted font-semibold">{{ formatNumber(entry.entity?.creditsCharged) }}</span>
                        </div>
                      </div>
                    </section>

                    <UCollapsible
                      v-if="entry.entity?.fileCount"
                      @update:open="(isOpen: boolean) => handleCollapsibleOpen(entry.entity!.id, isOpen)"
                    >
                      <template #default="{ open }">
                        <UButton
                          :label="`File (${entry.entity?.fileCount})`"
                          color="neutral"
                          variant="subtle"
                          :trailing-icon="open ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                        />
                      </template>

                      <template #content>
                        <ul class="w-full mt-4 p-2 space-y-3">
                          <template v-if="loadingJobId === entry.entity?.id">
                            <li class="ring ring-default p-4 rounded-lg bg-default text-center">
                              <UButton
                                loading
                                variant="ghost"
                                label="Loading files..."
                              />
                            </li>
                          </template>
                          <template v-else-if="entry.entity?.id && jobResultsCache[entry.entity!.id]">
                            <li
                              v-for="file in (entry.entity?.id ? jobResultsCache[entry.entity.id]?.files : [])"
                              :key="file.fileId"
                              class="ring ring-default p-4 flex items-center justify-between gap-4 flex-wrap rounded-lg bg-default text-sm"
                            >
                              <section class="flex flex-wrap sm:items-center gap-3">
                                <div class="min-w-8">
                                  <UBadge
                                    :icon="file.errorMessage ? 'lucide:circle-x' : 'lucide:circle-check'"
                                    :color="file.errorMessage ? 'error' : 'success'"
                                    variant="subtle"
                                    size="xl"
                                  />
                                </div>

                                <div>
                                  <p><span class="text-muted">File Uploaded:</span> <span class="text-highlighted">{{ file.originalFilename }}</span></p>
                                  <span class="text-muted">{{ file.errorMessage || 'Processed completed' }}</span>
                                </div>
                              </section>

                              <div
                                v-if="file.creditsCharged"
                                class="flex items-center gap-4 flex-wrap"
                              >
                                <span class="text-muted">Token Usage:</span>
                                <div class="flex items-center gap-3">
                                  <LogoBadge src="img/coin.png" />
                                  <span class="text-highlighted font-semibold">{{ formatNumber(file.creditsCharged) }}</span>
                                </div>
                              </div>
                            </li>
                          </template>
                          <template v-else>
                            <li class="ring ring-default p-4 rounded-lg bg-default text-center text-muted">
                              No file details available
                            </li>
                          </template>
                        </ul>
                      </template>
                    </UCollapsible>
                  </BaseCard>
                </LayoutWrapper>
              </template>
            </ActivityTimeline>
          </LayoutWrapper>

          <section
            v-if="pending"
            class="flex items-center justify-center py-4"
          >
            <UIcon
              name="app:loading"
              size="24"
            />
          </section>
        </template>

        <BaseCard
          v-if="!pending && groupedLogs.length === 0"
          class="text-center py-8 text-muted"
        >
          No activity logs found.
        </BaseCard>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
