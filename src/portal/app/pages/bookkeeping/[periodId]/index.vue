<script setup lang="ts">
import type { BookkeepingDTO } from '@/types/dto'
import type { IRoute } from '@/constants/route'
import * as bookkeepingService from '@/services/bookkeeping.service'
import { useIntervalFn } from '@vueuse/core'

const route = useRoute()
const { toast } = useAppToast()

const periodId = computed(() => Number(route.params.periodId))

useHead({
  titleTemplate: 'Period Dashboard - %s',
})

const loading = reactive({
  upload: false,
  statements: false,
})

const fileQueue = ref<File[]>([])
const selectedBank = ref<string | null>(null)

const { data: periodRes, refresh: refreshPeriod } = await useAsyncData(
  () => bookkeepingService.getPeriod(periodId.value),
)

const period = computed(() => periodRes.value?.data)

const { data: statementsRes, refresh: refreshStatements } = await useAsyncData(
  () => bookkeepingService.listStatements(periodId.value),
)

const statements = computed(() => statementsRes.value?.data ?? [])

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

const bankOptions = [
  { label: 'Auto-detect', value: null },
  { label: 'Chase', value: 'chase' },
  { label: 'Bank of America', value: 'boa' },
  { label: 'Wells Fargo', value: 'wells_fargo' },
  { label: 'Citibank', value: 'citi' },
  // { label: 'Other', value: 'other' },
]

const periodLabel = computed(() => {
  if (!period.value) return ''
  return period.value.label ?? `${getMonthName(period.value.month)} ${period.value.year}`
})

function getMonthName(month: number) {
  return monthOptions.find(m => m.value === month)?.label ?? ''
}

const totalTransactions = computed(() => {
  return statements.value.reduce((sum, s) => sum + s.transactionCount, 0)
})

function formatCurrency(value: number | null) {
  if (value === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function getStatusColor(status: BookkeepingDTO.StatementStatus) {
  const colors: Record<BookkeepingDTO.StatementStatus, string> = {
    PENDING: 'neutral',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    FAILED: 'error',
  }
  return colors[status]
}

function getStatusIcon(status: BookkeepingDTO.StatementStatus) {
  const icons: Record<BookkeepingDTO.StatementStatus, string> = {
    PENDING: 'lucide:clock',
    PROCESSING: 'lucide:loader',
    COMPLETED: 'lucide:check-circle',
    FAILED: 'lucide:x-circle',
  }
  return icons[status]
}

// Polling for processing status
const { pause, resume } = useIntervalFn(async () => {
  const processing = statements.value.some(s => s.status === 'PROCESSING' || s.status === 'PENDING')
  if (processing) {
    await refreshStatements()
    await refreshPeriod()
  }
  else {
    pause()
  }
}, 3000, { immediate: false })

watch(statements, (newStmts) => {
  const needsPolling = newStmts.some(s => s.status === 'PROCESSING' || s.status === 'PENDING')
  if (needsPolling) {
    resume()
  }
}, { immediate: true })

watch(fileQueue, async (files) => {
  if (!files?.length) return
  await uploadFiles(files)
  fileQueue.value = []
}, { deep: false })

async function uploadFiles(files: File[]) {
  try {
    loading.upload = true

    for (const file of files) {
      await bookkeepingService.uploadStatement(periodId.value, file, selectedBank.value ?? undefined)
    }

    toast.add('success', {
      title: 'Upload started',
      description: `${files.length} file(s) uploaded. Processing...`,
    })

    await refreshStatements()
    await refreshPeriod()
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    loading.upload = false
  }
}

async function removeStatement(statement: BookkeepingDTO.BankStatement) {
  if (!confirm(`Are you sure you want to delete ${statement.fileName}?`))
    return

  try {
    loading.statements = true // Reuse loading state if possible, or just optimistic update
    await bookkeepingService.deleteStatement(periodId.value, statement.id)

    toast.add('success', { title: 'Statement deleted' })
    await refreshStatements()
    await refreshPeriod() // Update counts
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    loading.statements = false
  }
}

async function handleDeletePeriod() {
  if (!period.value) return
  if (!confirm(`Are you sure you want to delete ${periodLabel.value}?`)) return

  try {
    await bookkeepingService.deletePeriod(periodId.value)
    toast.add('success', { title: 'Period deleted' })
    navigateTo(toRoute('/bookkeeping'))
  }
  catch (e: any) {
    toast.addException(e)
  }
}
</script>

<template>
  <UDashboardPanel id="bookkeeping-period">
    <template #header>
      <LayoutHeader title="Bookkeeping" />
    </template>

    <template #body>
      <LayoutContent>
        <section class="space-y-6">
          <LayoutNavigator
            label="Back to Periods"
            :to="toRoute('/bookkeeping')"
          />

          <section class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 class="text-2xl font-bold text-highlighted flex items-center gap-2">
                <UIcon
                  name="lucide:calendar"
                  class="text-primary"
                />
                {{ periodLabel }}
              </h1>
              <p class="text-muted text-sm mt-1">
                Upload bank statements and review transactions
              </p>
            </div>
            <div>
              <UBadge
                v-if="period"
                :color="period.status === 'DRAFT' ? 'neutral' : period.status === 'PROCESSING' ? 'warning' : 'success'"
                :label="period.status"
                size="lg"
                variant="subtle"
              />

              <UButton
                v-if="period && period.statementCount === 0"
                icon="lucide:trash-2"
                color="error"
                variant="ghost"
                size="sm"
                @click="handleDeletePeriod"
              />
            </div>
          </section>

          <!-- Upload Section -->
          <UCard>
            <template #header>
              <section class="flex items-center gap-3">
                <UBadge
                  icon="lucide:upload"
                  color="primary"
                  variant="subtle"
                  size="lg"
                  :ui="{ base: 'size-8 flex items-center justify-center rounded-lg' }"
                />
                <div>
                  <h2 class="font-semibold text-highlighted">
                    Upload Bank Statements
                  </h2>
                  <p class="text-sm text-muted">
                    Drag and drop or click to browse
                  </p>
                </div>
              </section>
            </template>

            <section class="space-y-4">
              <UFormField label="Bank (optional)">
                <USelectMenu
                  v-model="selectedBank"
                  :items="bankOptions"
                  value-key="value"
                  placeholder="Auto-detect"
                  class="w-64"
                />
              </UFormField>

              <UFileUpload
                v-model="fileQueue"
                size="xl"
                multiple
                accept=".pdf,.csv,.xlsx,.xls"
                :label="`Drop your bank statements here`"
                :disabled="loading.upload"
                :ui="{ root: 'gap-5' }"
              >
                <template #description>
                  <section class="flex flex-col gap-2 text-center">
                    <span>or click to browse from your computer</span>
                    <span class="text-xs text-muted">PDF, CSV, XLSX up to 50 MB</span>
                  </section>
                </template>
              </UFileUpload>
            </section>
          </UCard>

          <!-- Uploaded Statements -->
          <UCard v-if="statements.length > 0">
            <template #header>
              <section class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UBadge
                    icon="lucide:file-text"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    :ui="{ base: 'size-8 flex items-center justify-center rounded-lg' }"
                  />
                  <div>
                    <h2 class="font-semibold text-highlighted">
                      Uploaded Statements
                    </h2>
                    <p class="text-sm text-muted">
                      {{ statements.length }} statement{{ statements.length > 1 ? 's' : '' }}
                      • {{ totalTransactions }} total transactions
                    </p>
                  </div>
                </div>
              </section>
            </template>

            <section class="space-y-3">
              <section
                v-for="statement in statements"
                :key="statement.id"
                class="flex items-center justify-between gap-4 p-3 rounded-lg bg-elevated/50 hover:bg-elevated transition-all"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    :name="statement.fileName.endsWith('.pdf') ? 'lucide:file-text' : 'lucide:file-spreadsheet'"
                    class="text-xl text-muted"
                  />
                  <div>
                    <p class="font-medium text-highlighted">
                      {{ statement.fileName }}
                    </p>
                    <p class="text-xs text-muted">
                      <template v-if="statement.bank">
                        {{ statement.bank }} •
                      </template>
                      <template v-if="statement.status === 'COMPLETED'">
                        {{ statement.transactionCount }} transactions
                      </template>
                      <template v-else>
                        Extracting...
                      </template>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UBadge
                    :icon="getStatusIcon(statement.status)"
                    :color="getStatusColor(statement.status)"
                    :label="statement.status"
                    size="xs"
                    variant="subtle"
                  />
                  <UButton
                    icon="lucide:trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :disabled="statement.status === 'PROCESSING'"
                    @click="removeStatement(statement)"
                  />
                </div>
              </section>
            </section>

            <template #footer>
              <section class="flex items-center justify-end gap-2">
                <UButton
                  label="Review Transactions"
                  trailing-icon="lucide:arrow-right"
                  :disabled="statements.every(s => s.status !== 'COMPLETED')"
                  :to="toRoute(`/bookkeeping/${periodId}/transactions` as IRoute)"
                />
              </section>
            </template>
          </UCard>

          <!-- Summary Card (when transactions exist) -->
          <UCard v-if="period.transactionCount > 0">
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Period Summary
              </h2>
            </template>

            <section class="grid grid-cols-3 gap-6">
              <div class="text-center">
                <p class="text-xs text-muted uppercase mb-1">
                  Total Income
                </p>
                <p class="text-2xl font-bold text-success">
                  {{ formatCurrency(period?.totalCredit ?? 0) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted uppercase mb-1">
                  Total Expenses
                </p>
                <p class="text-2xl font-bold text-error">
                  {{ formatCurrency(period?.totalDebit ?? 0) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted uppercase mb-1">
                  Net Change
                </p>
                <p
                  class="text-2xl font-bold"
                  :class="(period?.netChange ?? 0) >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(period?.netChange ?? 0) }}
                </p>
              </div>
            </section>
          </UCard>

          <!-- Payroll Card -->
          <UCard>
            <template #header>
              <section class="flex items-center gap-3">
                <UBadge
                  icon="lucide:users"
                  color="info"
                  variant="subtle"
                  size="lg"
                  :ui="{ base: 'size-8 flex items-center justify-center rounded-lg' }"
                />
                <div>
                  <h2 class="font-semibold text-highlighted">
                    Payroll
                  </h2>
                  <p class="text-sm text-muted">
                    Manage employee salaries and export GDT tax template
                  </p>
                </div>
              </section>
            </template>

            <section class="flex items-center justify-between">
              <p class="text-muted">
                Generate salary tax reports for the General Department of Taxation.
              </p>
              <UButton
                label="Manage Payroll"
                icon="lucide:arrow-right"
                :to="toRoute(`/bookkeeping/${periodId}/payroll` as IRoute)"
              />
            </section>
          </UCard>
        </section>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
