<script setup lang="ts">
import type { BookkeepingDTO } from '@/types/dto'
import * as bookkeepingService from '@/services/bookkeeping.service'

const route = useRoute()
const { toast } = useAppToast()

const periodId = computed(() => Number(route.params.periodId))

useHead({
  titleTemplate: 'Export Excel - %s',
})

const loading = reactive({
  export: false,
})

const selectedTemplate = ref<string>('cash_flow') // Default matching mock service

// Fetch templates
const templates = ref<BookkeepingDTO.ExcelTemplate[]>([])
async function fetchTemplates() {
  try {
    const res = await bookkeepingService.listTemplates()
    if (res.data) {
      templates.value = res.data
    }
  }
  catch (e) {
    console.error('Failed to fetch templates', e)
  }
}

onMounted(() => {
  fetchTemplates()
})

// Fetch Period Data for Summary
const { data: periodRes } = await useAsyncData(
  () => bookkeepingService.getPeriod(periodId.value),
)
const period = computed(() => periodRes.value?.data)

const summary = computed(() => ({
  transactionCount: period.value?.transactionCount ?? 0,
  totalIncome: period.value?.totalCredit ?? 0,
  totalExpense: period.value?.totalDebit ?? 0,
  uncategorizedCount: 0, // Not available in period DTO yet, placeholder
  periodLabel: period.value?.label ?? '',
  netChange: period.value?.netChange ?? 0,
}))

const sheets = ['Transactions', 'Summary', 'Categories']

const defaultFilename = computed(() => {
  const year = period.value?.year
  const month = period.value?.month
  if (year != null && month != null)
    return `bookkeeping_${year}_${month}.xlsx`
  return `bookkeeping_${periodId.value}.xlsx`
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

async function handleExport() {
  try {
    loading.export = true

    let templateValue: string | undefined
    if (selectedTemplate.value === 'custom') {
      if (!customTemplateFile.value) {
        toast.add('error', { title: 'Error', description: 'Please upload a custom template' })
        return
      }
    }
    else {
      const selectedTemplateObj = templates.value.find(t => t.id === selectedTemplate.value)
      templateValue = selectedTemplateObj?.value
    }

    const { blob, filename } = await bookkeepingService.exportExcel(periodId.value, templateValue)
    const objectUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename ?? defaultFilename.value
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(objectUrl)
    toast.add('success', { title: 'Download started', description: a.download })
  }
  catch (e) {
    toast.addException(e)
  }
  finally {
    loading.export = false
  }
}

// Custom template upload
const customTemplateFile = ref<File | null>(null)
const showCustomUpload = ref(false)

function handleCustomTemplateSelect(files: File[]) {
  if (files.length > 0) {
    customTemplateFile.value = files[0]
    toast.add('success', {
      title: 'Template uploaded',
      description: 'Custom template will be used for export',
    })
  }
}
</script>

<template>
  <UDashboardPanel id="bookkeeping-export">
    <template #header>
      <LayoutHeader title="Bookkeeping" />
    </template>

    <template #body>
      <LayoutContent>
        <section class="space-y-6">
          <LayoutNavigator
            label="Back to Transactions"
            :to="toRoute(`/bookkeeping/${periodId}/transactions`)"
          />

          <section class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 class="text-2xl font-bold text-highlighted flex items-center gap-2">
                <UIcon
                  name="lucide:download"
                  class="text-primary"
                />
                Export Excel
              </h1>
              <p class="text-muted text-sm mt-1">
                {{ summary.periodLabel }} • Select a template and download
              </p>
            </div>
          </section>

          <!-- Warning for uncategorized -->
          <!-- Removed uncategorized warning until API supports it -->

          <!-- Template Selection -->
          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Select Template
              </h2>
            </template>

            <section class="space-y-4">
              <div
                v-for="template in templates"
                :key="template.id"
                class="flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer"
                :class="selectedTemplate === template.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-default hover:border-muted'"
                @click="selectedTemplate = template.id"
              >
                <URadio
                  :model-value="selectedTemplate"
                  :value="template.id"
                  @update:model-value="selectedTemplate = template.id"
                />
                <div class="flex-1">
                  <h3 class="font-semibold text-highlighted">
                    {{ template.name }}
                  </h3>
                  <p class="text-sm text-muted mt-1">
                    {{ template.description }}
                  </p>
                </div>
              </div>

              <!-- Custom Template Option -->
              <div
                class="flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer"
                :class="selectedTemplate === 'custom'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-default hover:border-muted'"
                @click="selectedTemplate = 'custom'; showCustomUpload = true"
              >
                <URadio
                  :model-value="selectedTemplate"
                  value="custom"
                  @update:model-value="selectedTemplate = 'custom'"
                />
                <div class="flex-1">
                  <h3 class="font-semibold text-highlighted">
                    Custom Template
                  </h3>
                  <p class="text-sm text-muted mt-1">
                    Upload your own Excel template
                  </p>

                  <section
                    v-if="selectedTemplate === 'custom'"
                    class="mt-4"
                  >
                    <template v-if="customTemplateFile">
                      <div class="flex items-center gap-2 p-2 bg-elevated rounded">
                        <UIcon
                          name="lucide:file-spreadsheet"
                          class="text-success"
                        />
                        <span class="text-sm text-highlighted">{{ customTemplateFile.name }}</span>
                        <UButton
                          icon="lucide:x"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click.stop="customTemplateFile = null"
                        />
                      </div>
                    </template>
                    <template v-else>
                      <UFileUpload
                        accept=".xlsx,.xls"
                        size="sm"
                        label="Upload template"
                        @update:model-value="handleCustomTemplateSelect"
                      />
                    </template>
                  </section>
                </div>
              </div>
            </section>
          </UCard>

          <!-- Preview -->
          <UCard>
            <template #header>
              <h2 class="font-semibold text-highlighted">
                Export Preview
              </h2>
            </template>

            <section class="space-y-4">
              <div class="flex items-center gap-4 flex-wrap">
                <span class="text-sm text-muted">Sheets:</span>
                <div class="flex gap-2">
                  <UBadge
                    v-for="sheet in sheets"
                    :key="sheet"
                    :label="sheet"
                    variant="subtle"
                    color="neutral"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-elevated/50 rounded-lg">
                <div>
                  <p class="text-xs text-muted uppercase">
                    Transactions
                  </p>
                  <p class="text-lg font-semibold text-highlighted">
                    {{ summary.transactionCount }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Total Income
                  </p>
                  <p class="text-lg font-semibold text-success">
                    {{ formatCurrency(summary.totalIncome) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Total Expenses
                  </p>
                  <p class="text-lg font-semibold text-error">
                    {{ formatCurrency(summary.totalExpense) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Net Change
                  </p>
                  <p
                    class="text-lg font-semibold"
                    :class="summary.netChange >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(summary.netChange) }}
                  </p>
                </div>
              </div>
            </section>

            <template #footer>
              <section class="flex items-center justify-end gap-2">
                <UButton
                  label="Cancel"
                  variant="outline"
                  color="neutral"
                  :to="toRoute(`/bookkeeping/${periodId}/transactions`)"
                />
                <UButton
                  icon="lucide:download"
                  label="Download Excel"
                  :loading="loading.export"
                  :disabled="selectedTemplate === 'custom' && !customTemplateFile"
                  @click="handleExport"
                />
              </section>
            </template>
          </UCard>
        </section>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
