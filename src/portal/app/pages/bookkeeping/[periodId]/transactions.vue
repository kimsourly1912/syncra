<script setup lang="ts">
import type { BookkeepingDTO } from '@/types/dto'
import * as bookkeepingService from '@/services/bookkeeping.service'

const route = useRoute()
const { toast } = useAppToast()

const periodId = computed(() => Number(route.params.periodId))

useHead({
  titleTemplate: 'Transactions - %s',
})

const loading = reactive({
  transactions: false,
  save: false,
  bulkUpdate: false,
})

const search = ref('')
const selectedCategory = ref<string | null>(null)
const selectedRows = ref<number[]>([])
const bulkCategoryValue = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)

// Fetch categories from API
const categories = ref<BookkeepingDTO.Category[]>([])
async function fetchCategories() {
  try {
    const res = await bookkeepingService.listCategories()
    if (res.data) {
      categories.value = res.data
    }
  }
  catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

onMounted(() => {
  fetchCategories()
})

const categoryOptions = computed(() => [
  { label: 'All Categories', value: null },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])

const categorySelectOptions = computed(() => [
  { label: '-- Select Category --', value: null },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
  { label: '+ Add Custom Category', value: '__new__' },
])

// Transactions Data
const transactions = ref<BookkeepingDTO.Transaction[]>([])
const totalElements = ref(0)
const totalPages = ref(0)

const { data: txnData, refresh: refreshTransactions, status: txnStatus } = await useAsyncData(
  () => bookkeepingService.listTransactions(periodId.value, {
    page: page.value - 1, // backend is 0-indexed
    pageSize: pageSize.value,
    category: selectedCategory.value ?? undefined,
    search: search.value || undefined,
  }),
  {
    watch: [page, pageSize, selectedCategory, search], // Auto-refresh on changes
  },
)

watchEffect(() => {
  if (txnData.value?.data) {
    transactions.value = txnData.value.data.content
    totalElements.value = txnData.value.data.totalElements
    totalPages.value = txnData.value.data.totalPages
  }
})

// Period Data for Summary
const { data: periodRes } = await useAsyncData(
  () => bookkeepingService.getPeriod(periodId.value),
)
const period = computed(() => periodRes.value?.data)

const summary = computed(() => ({
  totalIncome: period.value?.totalCredit ?? 0,
  totalExpense: period.value?.totalDebit ?? 0,
  netChange: period.value?.netChange ?? 0,
  uncategorizedCount: 0, // We might need a separate endpoint or field for this if not in period
}))

// Function to fetch transaction specific summary if needed, but period usually holds aggregates.
// However, 'uncategorizedCount' might not be on period DTO currently.
// We can ignore it or estimate from current page (inaccurate).
// Backend Period entity has transactionCount but not uncategorizedCount.
// Let's assume we don't show uncategorized count globally for now, or just check current page.

const monthLabel = computed(() => {
  if (!period.value) return ''
  return period.value.label || `${period.value.month}/${period.value.year}`
})

function formatCurrency(value: number | null) {
  if (value === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function _getCategoryName(categoryId: string | null) {
  if (!categoryId) return null
  return categories.value.find(c => c.id === categoryId)?.name ?? categoryId
}

function toggleRowSelection(id: number) {
  const idx = selectedRows.value.indexOf(id)
  if (idx >= 0) {
    selectedRows.value.splice(idx, 1)
  }
  else {
    selectedRows.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedRows.value.length === transactions.value.length) {
    selectedRows.value = []
  }
  else {
    selectedRows.value = transactions.value.map(t => t.id)
  }
}

async function handleCategoryChange(transactionId: number, value: string | null) {
  if (value === '__new__') {
    openNewCategoryModal(transactionId)
    return
  }

  try {
    const res = await bookkeepingService.updateTransaction(periodId.value, transactionId, {
      category: value ?? undefined, // Send empty string or undefined to clear? API expects string.
    })

    if (res.success) {
      // Update local state locally to avoid full refresh flicker
      const txn = transactions.value.find(t => t.id === transactionId)
      if (txn) {
        txn.category = value
        txn.isCategorized = !!value
      }
      toast.add('success', { title: 'Category updated' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
}

const newCategoryModal = reactive({
  open: false,
  name: '',
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
  targetTransactionId: null as number | null,
})

function openNewCategoryModal(transactionId?: number) {
  newCategoryModal.open = true
  newCategoryModal.name = ''
  newCategoryModal.type = 'EXPENSE'
  newCategoryModal.targetTransactionId = transactionId ?? null
}

async function handleCreateCategory() {
  if (!newCategoryModal.name.trim()) {
    toast.add('warning', { title: 'Enter category name' })
    return
  }

  try {
    const res = await bookkeepingService.createCategory(newCategoryModal.name, newCategoryModal.type)
    if (res.data) {
      categories.value = res.data

      if (newCategoryModal.targetTransactionId) {
        // Find the newly created category ID (assuming name matching or returned list includes it)
        // Ideally backend returns the created category or list.
        // Let's assume the name normalized is ID or we find it.
        const newCat = res.data.find(c => c.name === newCategoryModal.name)
        if (newCat) {
          await handleCategoryChange(newCategoryModal.targetTransactionId, newCat.id)
        }
      }

      newCategoryModal.open = false
      toast.add('success', { title: 'Category created' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
}

async function handleBulkCategoryUpdate() {
  if (!bulkCategoryValue.value || selectedRows.value.length === 0) return

  if (bulkCategoryValue.value === '__new__') {
    openNewCategoryModal()
    return
  }

  try {
    loading.bulkUpdate = true
    const res = await bookkeepingService.bulkUpdateCategory(
      periodId.value,
      selectedRows.value,
      bulkCategoryValue.value,
    )

    if (res.success) {
      toast.add('success', {
        title: 'Categories updated',
        description: `${selectedRows.value.length} transactions updated`,
      })
      selectedRows.value = []
      bulkCategoryValue.value = null
      refreshTransactions()
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    loading.bulkUpdate = false
  }
}
</script>

<template>
  <UDashboardPanel id="bookkeeping-transactions">
    <template #header>
      <LayoutHeader title="Bookkeeping" />
    </template>

    <template #body>
      <LayoutContent>
        <section class="space-y-6">
          <LayoutNavigator
            label="Back to Period"
            :to="toRoute(`/bookkeeping/${periodId}`)"
          />

          <section class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 class="text-2xl font-bold text-highlighted flex items-center gap-2">
                <UIcon
                  name="lucide:list"
                  class="text-primary"
                />
                Review Transactions
              </h1>
              <p class="text-muted text-sm mt-1">
                {{ monthLabel }} • Review and categorize before exporting
              </p>
            </div>
          </section>

          <!-- Warning for uncategorized -->
          <!-- Note: Removed uncategorized count for now as it needs aggregate API support -->

          <!-- Filters and Bulk Actions -->
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <section class="flex items-center gap-4 flex-wrap">
              <UInput
                v-model="search"
                icon="lucide:search"
                placeholder="Search transactions..."
                class="w-64"
                :loading="txnStatus === 'pending'"
              />

              <USelectMenu
                v-model="selectedCategory"
                :items="categoryOptions"
                value-key="value"
                placeholder="All Categories"
                class="w-48"
              />

              <div class="flex-1" />

              <template v-if="selectedRows.length > 0">
                <span class="text-sm text-muted">
                  {{ selectedRows.length }} selected
                </span>
                <USelectMenu
                  v-model="bulkCategoryValue"
                  :items="categorySelectOptions"
                  value-key="value"
                  placeholder="Set Category"
                  class="w-48"
                />
                <UButton
                  label="Apply"
                  size="sm"
                  :disabled="!bulkCategoryValue"
                  :loading="loading.bulkUpdate"
                  @click="handleBulkCategoryUpdate"
                />
              </template>

              <UButton
                icon="lucide:plus"
                label="Add Category"
                variant="outline"
                color="neutral"
                size="sm"
                @click="openNewCategoryModal()"
              />
            </section>
          </UCard>

          <!-- Transactions Table -->
          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <section class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-elevated">
                  <tr>
                    <th class="p-3 text-left w-12">
                      <UCheckbox
                        :model-value="selectedRows.length === transactions.length && transactions.length > 0"
                        :indeterminate="selectedRows.length > 0 && selectedRows.length < transactions.length"
                        @update:model-value="toggleSelectAll"
                      />
                    </th>
                    <th class="p-3 text-left text-sm font-medium text-muted">
                      Date
                    </th>
                    <th class="p-3 text-left text-sm font-medium text-muted">
                      Description
                    </th>
                    <th class="p-3 text-right text-sm font-medium text-muted">
                      Debit
                    </th>
                    <th class="p-3 text-right text-sm font-medium text-muted">
                      Credit
                    </th>
                    <th class="p-3 text-left text-sm font-medium text-muted w-48">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody v-if="txnStatus === 'pending' && transactions.length === 0">
                  <tr>
                    <td
                      colspan="6"
                      class="p-8 text-center text-muted"
                    >
                      Loading transactions...
                    </td>
                  </tr>
                </tbody>
                <tbody v-else-if="transactions.length === 0">
                  <tr>
                    <td
                      colspan="6"
                      class="p-8 text-center text-muted"
                    >
                      No transactions found
                    </td>
                  </tr>
                </tbody>
                <tbody v-else>
                  <tr
                    v-for="txn in transactions"
                    :key="txn.id"
                    class="border-t border-default hover:bg-elevated/50 transition-colors"
                    :class="{ 'bg-warning/5': !txn.isCategorized }"
                  >
                    <td class="p-3">
                      <UCheckbox
                        :model-value="selectedRows.includes(txn.id)"
                        @update:model-value="toggleRowSelection(txn.id)"
                      />
                    </td>
                    <td class="p-3 text-sm text-muted whitespace-nowrap">
                      {{ formatDate(txn.date) }}
                    </td>
                    <td class="p-3">
                      <span class="text-highlighted font-medium block">{{ txn.description }}</span>
                      <span
                        v-if="txn.notes"
                        class="text-xs text-muted"
                      >{{ txn.notes }}</span>
                      <UBadge
                        v-if="txn.isDuplicate"
                        color="warning"
                        variant="subtle"
                        size="xs"
                        label="Duplicate"
                        class="mt-1"
                      />
                    </td>
                    <td class="p-3 text-right">
                      <span
                        v-if="txn.debit"
                        class="text-error font-medium"
                      >
                        {{ formatCurrency(txn.debit) }}
                      </span>
                      <span
                        v-else
                        class="text-muted"
                      >-</span>
                    </td>
                    <td class="p-3 text-right">
                      <span
                        v-if="txn.credit"
                        class="text-success font-medium"
                      >
                        {{ formatCurrency(txn.credit) }}
                      </span>
                      <span
                        v-else
                        class="text-muted"
                      >-</span>
                    </td>
                    <td class="p-3">
                      <USelectMenu
                        :model-value="txn.category"
                        :items="categorySelectOptions"
                        value-key="value"
                        placeholder="Select..."
                        size="sm"
                        class="w-full"
                        :ui="{
                          base: !txn.isCategorized ? 'ring-warning' : '',
                        }"
                        @update:model-value="(v) => handleCategoryChange(txn.id, v)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <!-- Pagination -->
            <section class="p-4 border-t border-default flex items-center justify-between">
              <span class="text-sm text-muted">
                Showing {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, totalElements) }}
                of {{ totalElements }}
              </span>
              <div class="flex items-center gap-2">
                <UButton
                  icon="lucide:chevron-left"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :disabled="page === 1"
                  @click="page--"
                />
                <span class="text-sm text-muted px-2">
                  Page {{ page }} of {{ totalPages }}
                </span>
                <UButton
                  icon="lucide:chevron-right"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :disabled="page >= totalPages"
                  @click="page++"
                />
              </div>
            </section>
          </UCard>

          <!-- Summary Footer -->
          <UCard>
            <section class="flex items-center justify-between gap-4 flex-wrap">
              <section class="flex items-center gap-8">
                <div>
                  <p class="text-xs text-muted uppercase">
                    Income
                  </p>
                  <p class="text-lg font-semibold text-success">
                    {{ formatCurrency(summary.totalIncome) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Expenses
                  </p>
                  <p class="text-lg font-semibold text-error">
                    {{ formatCurrency(summary.totalExpense) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase">
                    Net
                  </p>
                  <p
                    class="text-lg font-semibold"
                    :class="summary.netChange >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(summary.netChange) }}
                  </p>
                </div>
              </section>

              <section class="flex items-center gap-2">
                <UButton
                  label="Save Changes"
                  variant="outline"
                  color="neutral"
                  :loading="loading.save"
                />
                <UButton
                  label="Export Excel"
                  icon="lucide:download"
                  trailing-icon="lucide:arrow-right"
                  :to="toRoute(`/bookkeeping/${periodId}/export`)"
                />
              </section>
            </section>
          </UCard>
        </section>
      </LayoutContent>

      <!-- New Category Modal -->
      <UModal
        v-model:open="newCategoryModal.open"
        title="Add Custom Category"
        description="Create a new category for transaction classification"
      >
        <template #body>
          <section class="space-y-4">
            <UFormField label="Category Name">
              <UInput
                v-model="newCategoryModal.name"
                placeholder="e.g., Consulting Fees"
              />
            </UFormField>

            <UFormField label="Type">
              <USelectMenu
                v-model="newCategoryModal.type"
                :items="[
                  { label: 'Income', value: 'INCOME' },
                  { label: 'Expense', value: 'EXPENSE' },
                  { label: 'Transfer', value: 'TRANSFER' },
                ]"
                value-key="value"
              />
            </UFormField>
          </section>
        </template>

        <template #footer>
          <section class="flex items-center gap-2 justify-end">
            <UButton
              label="Cancel"
              variant="outline"
              color="neutral"
              @click="newCategoryModal.open = false"
            />
            <UButton
              label="Create Category"
              @click="handleCreateCategory"
            />
          </section>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
