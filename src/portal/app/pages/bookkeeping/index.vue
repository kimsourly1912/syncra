<script setup lang="ts">
import type { BookkeepingDTO } from '@/types/dto'
import * as bookkeepingService from '@/services/bookkeeping.service'

useHead({
  titleTemplate: 'Bookkeeping - %s',
})

const { toast } = useAppToast()

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

const open = reactive({
  createPeriod: false,
})

const newPeriod = reactive({
  year: currentYear,
  month: new Date().getMonth() + 1,
})

const loading = reactive({
  periods: false,
  create: false,
})

const periods = ref<BookkeepingDTO.Period[]>([])

const { data: periodData, refresh, status } = await useAsyncData(
  () => bookkeepingService.listPeriods(selectedYear.value),
  { watch: [selectedYear] },
)

// Sync data
watchEffect(() => {
  if (periodData.value?.data) {
    periods.value = periodData.value.data
  }
})

const filteredPeriods = computed(() => {
  return periods.value // API already filters by year
})

// Fetch available years
const availableYears = ref<number[]>([currentYear])
async function fetchYears() {
  try {
    const res = await bookkeepingService.listPeriodYears()
    if (res.data) {
      const years = new Set([...res.data, currentYear])
      availableYears.value = Array.from(years).sort((a, b) => b - a)
    }
  }
  catch (e) {
    // Fallback
    console.error('Failed to fetch years', e)
  }
}

onMounted(() => {
  fetchYears()
})

const yearOptions = computed(() => {
  return availableYears.value.map(y => ({ label: String(y), value: y }))
})

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

function getMonthName(month: number) {
  return monthOptions.find(m => m.value === month)?.label ?? ''
}

function formatPeriodLabel(period: BookkeepingDTO.Period) {
  return `${getMonthName(period.month)} ${period.year}`
}

function getStatusColor(status: BookkeepingDTO.PeriodStatus) {
  const colors: Record<BookkeepingDTO.PeriodStatus, string> = {
    DRAFT: 'neutral',
    PROCESSING: 'warning',
    READY: 'success',
    EXPORTED: 'info',
  }
  return colors[status]
}

function getStatusIcon(status: BookkeepingDTO.PeriodStatus) {
  const icons: Record<BookkeepingDTO.PeriodStatus, string> = {
    DRAFT: 'lucide:file-edit',
    PROCESSING: 'lucide:loader',
    READY: 'lucide:check-circle',
    EXPORTED: 'lucide:download',
  }
  return icons[status]
}

function formatCurrency(value: number | null) {
  if (value === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function openCreateModal() {
  newPeriod.year = currentYear
  newPeriod.month = new Date().getMonth() + 1
  open.createPeriod = true
}

async function handleCreatePeriod() {
  // Check local first
  const exists = periods.value.some(
    p => p.year === newPeriod.year && p.month === newPeriod.month,
  )

  if (exists) {
    toast.add('warning', {
      title: 'Period exists',
      description: `${getMonthName(newPeriod.month)} ${newPeriod.year} already exists.`,
    })
    return
  }

  try {
    loading.create = true
    const res = await bookkeepingService.createPeriod(newPeriod.year, newPeriod.month)

    if (res.data) {
      toast.add('success', {
        title: 'Period created',
        description: `${getMonthName(newPeriod.month)} ${newPeriod.year} has been created.`,
      })

      open.createPeriod = false
      refresh() // Refresh list
      navigateTo(toRoute(`/bookkeeping/${res.data.id}`))
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    loading.create = false
  }
}

function navigateToPeriod(period: BookkeepingDTO.Period) {
  navigateTo(toRoute(`/bookkeeping/${period.id}`))
}

async function handleDeletePeriod(period: BookkeepingDTO.Period) {
  if (!confirm(`Are you sure you want to delete ${formatPeriodLabel(period)}?`))
    return

  try {
    await bookkeepingService.deletePeriod(period.id)
    toast.add('success', { title: 'Period deleted' })
    refresh()
  }
  catch (e: any) {
    toast.addException(e)
  }
}
</script>

<template>
  <UDashboardPanel id="bookkeeping">
    <template #header>
      <LayoutHeader title="Bookkeeping" />
    </template>

    <template #body>
      <LayoutContent>
        <section class="space-y-6">
          <LayoutHeading
            title="Bookkeeping"
            desc="Manage your monthly accounting records"
          />

          <section class="flex items-center justify-between gap-4 flex-wrap">
            <UButton
              icon="lucide:plus"
              label="New Period"
              @click="openCreateModal"
            />

            <USelectMenu
              v-model="selectedYear"
              :items="yearOptions"
              value-key="value"
              class="w-32"
            />
          </section>

          <section
            v-if="filteredPeriods.length === 0"
            class="mt-8"
          >
            <section
              class="flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-accented bg-elevated/50"
            >
              <section class="flex flex-col gap-4 items-center text-center max-w-80">
                <UBadge
                  icon="lucide:calendar"
                  color="neutral"
                  variant="subtle"
                  size="xl"
                  :ui="{ base: 'size-10 flex items-center justify-center rounded-full' }"
                />
                <div>
                  <h1 class="text-xl text-highlighted font-semibold">
                    No Periods for {{ selectedYear }}
                  </h1>
                  <p class="text-muted text-sm mt-1">
                    Create a new period to start tracking your bookkeeping.
                  </p>
                </div>
                <UButton
                  icon="lucide:plus"
                  label="Create Period"
                  @click="openCreateModal"
                />
              </section>
            </section>
          </section>

          <section
            v-else
            class="grid gap-4"
          >
            <UCard
              v-for="period in filteredPeriods"
              :key="period.id"
              class="cursor-pointer hover:ring-primary/50 transition-all"
              @click="navigateToPeriod(period)"
            >
              <section class="flex items-start justify-between gap-4">
                <section class="flex items-center gap-4">
                  <UBadge
                    icon="lucide:calendar"
                    color="primary"
                    variant="subtle"
                    size="xl"
                    :ui="{ base: 'size-12 flex items-center justify-center rounded-lg' }"
                  />
                  <div>
                    <h2 class="text-lg font-semibold text-highlighted">
                      {{ formatPeriodLabel(period) }}
                    </h2>
                    <p class="text-sm text-muted">
                      <template v-if="period.statementCount > 0">
                        {{ period.statementCount }} statement{{ period.statementCount > 1 ? 's' : '' }}
                        • {{ period.transactionCount }} transaction{{ period.transactionCount > 1 ? 's' : '' }}
                      </template>
                      <template v-else>
                        No statements uploaded
                      </template>
                    </p>
                  </div>
                </section>

                <UBadge
                  :icon="getStatusIcon(period.status)"
                  :color="getStatusColor(period.status)"
                  :label="period.status"
                  variant="subtle"
                />
              </section>

              <section
                v-if="period.transactionCount > 0"
                class="mt-4 pt-4 border-t border-default grid grid-cols-3 gap-4"
              >
                <div>
                  <p class="text-xs text-muted uppercase">
                    Income
                  </p>
                  <p class="text-sm font-semibold text-success">
                    {{ formatCurrency(period.totalCredit) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Expenses
                  </p>
                  <p class="text-sm font-semibold text-error">
                    {{ formatCurrency(period.totalDebit) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Net
                  </p>
                  <p
                    class="text-sm font-semibold"
                    :class="(period.netChange ?? 0) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(period.netChange) }}
                  </p>
                </div>
              </section>

              <section class="mt-4 flex items-center gap-2 justify-end">
                <UButton
                  label="View"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  @click.stop="navigateToPeriod(period)"
                />
                <UButton
                  v-if="period.status === 'READY' || period.status === 'EXPORTED'"
                  label="Export"
                  icon="lucide:download"
                  size="sm"
                  @click.stop="navigateTo(toRoute(`/bookkeeping/${period.id}/export`))"
                />
                <UButton
                  v-if="period.statementCount === 0"
                  icon="lucide:trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click.stop="handleDeletePeriod(period)"
                />
              </section>
            </UCard>
          </section>
        </section>
      </LayoutContent>

      <!-- Create Period Modal -->
      <UModal
        v-model:open="open.createPeriod"
        title="Create New Period"
        description="Select the year and month for the new accounting period"
      >
        <template #body>
          <section class="space-y-4">
            <UFormField label="Year">
              <USelectMenu
                v-model="newPeriod.year"
                :items="[
                  { label: '2025', value: 2025 },
                  { label: '2024', value: 2024 },
                  { label: '2023', value: 2023 },
                ]"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Month">
              <USelectMenu
                v-model="newPeriod.month"
                :items="monthOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="periods.some(p => p.year === newPeriod.year && p.month === newPeriod.month)"
              color="warning"
              variant="soft"
              icon="lucide:alert-triangle"
              title="Period already exists"
              description="A period for this month already exists. You will be redirected to the existing period."
            />
          </section>
        </template>

        <template #footer>
          <section class="flex items-center gap-2 justify-end">
            <UButton
              label="Cancel"
              variant="outline"
              color="neutral"
              @click="open.createPeriod = false"
            />
            <UButton
              label="Create Period"
              :loading="loading.create"
              @click="handleCreatePeriod"
            />
          </section>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
