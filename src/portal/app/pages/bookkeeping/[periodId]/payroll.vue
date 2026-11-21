<script setup lang="ts">
import type { PayrollDTO, BookkeepingDTO } from '@/types/dto'
import * as payrollService from '@/services/payroll.service'
import * as bookkeepingService from '@/services/bookkeeping.service'

const route = useRoute()
const { toast } = useAppToast()

const periodId = computed(() => Number(route.params.periodId))

// State
const payrollRecord = ref<PayrollDTO.PayrollRecord | null>(null)
const isLoading = ref(false)
const isCreating = ref(false)
const isCloning = ref(false)
const showAddEmployee = ref(false)
const editingEmployee = ref<PayrollDTO.PayrollEmployee | null>(null)

// Clone state
const availablePeriods = ref<BookkeepingDTO.Period[]>([])
const selectedSourcePeriod = ref<number | BookkeepingDTO.Period | null>(null)

// Form state
const employeeForm = ref<PayrollDTO.PayrollEmployeeRequest>({})
const exchangeRateInput = ref<number>(4100)

// Computed
const hasPayroll = computed(() => payrollRecord.value !== null)
const employees = computed(() => payrollRecord.value?.employees ?? [])
const cloneablePeriods = computed(() =>
  (availablePeriods.value || []).filter(p => p.id !== periodId.value),
)

const employeeTypeOptions = [
  { label: 'Resident', value: 'RESIDENT' as const },
  { label: 'Non-Resident', value: 'NON_RESIDENT' as const },
]

// Actions
async function loadPayroll() {
  isLoading.value = true
  payrollRecord.value = null
  try {
    const res = await payrollService.getPayrollRecord(periodId.value)
    if (res && res.data) {
      payrollRecord.value = res.data
      exchangeRateInput.value = res.data.exchangeRate ?? 4100
    }
    else {
      console.log('No payroll record found (null data), showing create form')
      payrollRecord.value = null
    }
  }
  catch (e) {
    console.error('Failed to load payroll:', e)
    payrollRecord.value = null
  }
  finally {
    isLoading.value = false
  }
}

async function loadPeriods() {
  try {
    const res = await bookkeepingService.listPeriods()
    if (res && res.data) {
      availablePeriods.value = res.data
    }
    else {
      availablePeriods.value = []
    }
  }
  catch (e) {
    console.error('Failed to load periods:', e)
    availablePeriods.value = []
  }
}

async function createPayroll() {
  isCreating.value = true
  try {
    const res = await payrollService.createPayrollRecord(periodId.value, exchangeRateInput.value)
    if (res && res.data) {
      payrollRecord.value = res.data
      toast.add('success', { title: 'Payroll created' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    isCreating.value = false
  }
}

async function cloneFromPeriod() {
  const rawSource = selectedSourcePeriod.value as any
  // Handle case where USelectMenu returns full object instead of value
  const sourceId = (rawSource && typeof rawSource === 'object' && 'id' in rawSource)
    ? rawSource.id
    : rawSource

  if (!sourceId) return
  isCloning.value = true
  try {
    const res = await payrollService.clonePayroll(periodId.value, sourceId, exchangeRateInput.value)
    if (res && res.data) {
      payrollRecord.value = res.data
      toast.add('success', { title: 'Payroll cloned successfully' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    isCloning.value = false
  }
}

async function updateExchangeRate() {
  try {
    const res = await payrollService.updateExchangeRate(periodId.value, exchangeRateInput.value)
    if (res && res.data) {
      // update local
      if (payrollRecord.value) {
        payrollRecord.value.exchangeRate = res.data.exchangeRate
      }
      toast.add('success', { title: 'Exchange rate updated' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
}

async function handleSaveEmployee() {
  try {
    const isEdit = !!editingEmployee.value

    // Sanitize payload
    const form = employeeForm.value
    const payload: PayrollDTO.PayrollEmployeeRequest = {
      ...form,
      employeeType: (typeof form.employeeType === 'object' && form.employeeType)
        ? (form.employeeType as any).value
        : form.employeeType,
    }

    let res

    if (isEdit && editingEmployee.value) {
      res = await payrollService.updateEmployee(
        periodId.value,
        editingEmployee.value.id,
        payload,
      )
    }
    else {
      res = await payrollService.addEmployee(periodId.value, payload)
    }

    if (res && res.data) {
      // Update local state properly
      if (isEdit) {
        if (payrollRecord.value && payrollRecord.value.employees) {
          const idx = payrollRecord.value.employees.findIndex(e => e.id === res.data.id)
          if (idx !== -1) {
            payrollRecord.value.employees[idx] = res.data
          }
        }
      }
      else {
        if (payrollRecord.value) {
          if (!payrollRecord.value.employees) payrollRecord.value.employees = []
          payrollRecord.value.employees.push(res.data)
          payrollRecord.value.employeeCount = (payrollRecord.value.employeeCount || 0) + 1
        }
      }

      showAddEmployee.value = false
      toast.add('success', { title: isEdit ? 'Employee updated' : 'Employee added' })
    }
  }
  catch (e: any) {
    toast.addException(e)
  }
}

async function handleDeleteEmployee(employeeId: number) {
  if (!confirm('Are you sure you want to remove this employee?')) return
  try {
    await payrollService.deleteEmployee(periodId.value, employeeId)

    // Remove from local state to avoid reload
    if (payrollRecord.value && payrollRecord.value.employees) {
      payrollRecord.value.employees = payrollRecord.value.employees.filter(e => e.id !== employeeId)
      // Optional: update count if displayed
      if (payrollRecord.value.employeeCount !== undefined) {
        payrollRecord.value.employeeCount = payrollRecord.value.employees.length
      }
    }

    toast.add('success', { title: 'Employee removed' })
  }
  catch (e: any) {
    toast.addException(e)
  }
}

async function handleDeletePayroll() {
  if (!confirm('Are you sure you want to delete this entire payroll record? All employee data will be lost.')) return
  isLoading.value = true
  try {
    await payrollService.deletePayrollRecord(periodId.value)
    payrollRecord.value = null
    toast.add('success', { title: 'Payroll record deleted' })
  }
  catch (e: any) {
    toast.addException(e)
  }
  finally {
    isLoading.value = false
  }
}

async function handleExportStart() {
  try {
    const { blob, filename } = await payrollService.exportPayroll(periodId.value)
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename || `payroll_${periodId.value}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  }
  catch (e: any) {
    toast.addException(e)
  }
}

function openAddEmployeeResult() {
  editingEmployee.value = null
  employeeForm.value = {
    employeeId: '',
    nationality: '',
    name: '',
    employeeType: undefined,
    spouseCount: 0,
    minorChildrenCount: 0,
    basicSalary: 0,
    pensionFund: 0,
    function: '',
  }
  showAddEmployee.value = true
}

function openEditEmployee(emp: PayrollDTO.PayrollEmployee) {
  editingEmployee.value = emp
  employeeForm.value = {
    ...emp,
    employeeId: emp.employeeId ?? '',
    nationality: emp.nationality ?? '',
    employeeType: emp.employeeType ?? undefined,
    remarks: emp.remarks ?? '',
    name: emp.name ?? '',
    function: emp.function ?? '',
  }
  showAddEmployee.value = true
}

// Helpers
function getPeriodLabel(period: BookkeepingDTO.Period) {
  if (!period || !period.month) return `Period ${period.id}`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[period.month - 1]} ${period.year}`
}

function formatCurrency(val: number | null | undefined) {
  if (val == null) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function getNetPay(emp: PayrollDTO.PayrollEmployee) {
  // Simple estimation for display until backend provides calculated fields
  // Net = Basic + Overtime + Commission + 13th - Pension (approx, inaccurate tax)
  const income = (emp.basicSalary || 0) + (emp.overtime || 0) + (emp.commission || 0) + (emp.thirteenthSalary || 0)
  const deduction = (emp.pensionFund || 0)
  return income - deduction
}

onMounted(() => {
  loadPayroll()
  loadPeriods()
})
</script>

<template>
  <UDashboardPanel id="payroll">
    <template #header>
      <LayoutHeader title="Payroll" />
    </template>

    <template #body>
      <LayoutContent>
        <section class="space-y-6">
          <LayoutNavigator
            label="Back to Period"
            :to="'/bookkeeping/' + periodId"
          />

          <!-- Loading -->
          <section
            v-if="isLoading"
            class="flex justify-center py-12"
          >
            <UIcon
              name="lucide:loader-2"
              class="w-8 h-8 animate-spin text-muted"
            />
          </section>

          <!-- Create Payroll Form -->
          <UCard v-else-if="!hasPayroll">
            <template #header>
              <h2 class="text-lg font-semibold">
                Create Payroll
              </h2>
              <p class="text-sm text-muted">
                Set up payroll for this period
              </p>
            </template>

            <section class="space-y-4">
              <UFormField label="Exchange Rate (USD to KHR)">
                <UInput
                  v-model.number="exchangeRateInput"
                  type="number"
                  placeholder="4100"
                />
              </UFormField>

              <!-- Clone from Previous Option -->
              <div
                v-if="cloneablePeriods && cloneablePeriods.length > 0"
                class="p-4 rounded-lg bg-elevated/50 space-y-3"
              >
                <p class="text-sm font-medium">
                  Copy employees from previous month?
                </p>
                <div class="flex items-center gap-3">
                  <USelectMenu
                    v-model="selectedSourcePeriod"
                    :items="cloneablePeriods"
                    option-attribute="label"
                    value-attribute="id"
                    placeholder="Select period..."
                    class="flex-1"
                  >
                    <template #label>
                      <span v-if="selectedSourcePeriod">
                        {{ (typeof selectedSourcePeriod === 'object' && selectedSourcePeriod) ? selectedSourcePeriod.label : cloneablePeriods.find(p => p.id === selectedSourcePeriod)?.label }}
                      </span>
                      <span
                        v-else
                        class="text-muted"
                      >Select period...</span>
                    </template>
                    <template #option="{ option }">
                      <span>{{ getPeriodLabel(option) }}</span>
                    </template>
                  </USelectMenu>
                  <UButton
                    label="Copy & Create"
                    icon="lucide:copy"
                    :loading="isCloning"
                    :disabled="!selectedSourcePeriod"
                    @click="cloneFromPeriod"
                  />
                </div>
                <p class="text-xs text-muted">
                  This will copy all employees with their salary data. You can edit them afterward.
                </p>
              </div>

              <hr class="border-default">

              <UButton
                label="Create Empty Payroll"
                icon="lucide:plus"
                variant="outline"
                :loading="isCreating"
                @click="createPayroll"
              />
            </section>
          </UCard>

          <!-- Payroll Data View -->
          <template v-else>
            <!-- Header Actions -->
            <section class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 class="text-xl font-bold">
                  Payroll Report
                </h2>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex items-center gap-1 text-sm bg-elevated px-2 py-1 rounded">
                    <span class="text-muted">Exchange Rate:</span>
                    <UInput
                      v-model.number="exchangeRateInput"
                      type="number"
                      class="w-20 text-right h-6 text-sm"
                      variant="none"
                      @blur="updateExchangeRate"
                    />
                    <span class="text-muted">KHR/USD</span>
                  </div>
                  <span class="text-xs text-muted ml-2">(Click to edit)</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="h-4 w-px bg-default mx-1" />
                <UButton
                  label="Download Excel (GDT)"
                  icon="lucide:file-spreadsheet"
                  variant="outline"
                  @click="handleExportStart"
                />
                <UButton
                  label="Add Employee"
                  icon="lucide:plus"
                  @click="openAddEmployeeResult"
                />
              </div>
            </section>

            <!-- Employees Table -->
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-elevated text-xs uppercase text-muted font-medium">
                    <tr>
                      <th class="p-3 text-left">
                        No.
                      </th>
                      <th class="p-3 text-left">
                        ID
                      </th>
                      <th class="p-3 text-left">
                        Employee Name
                      </th>
                      <th class="p-3 text-left">
                        Position
                      </th>
                      <th class="p-3 text-left">
                        Type
                      </th>
                      <th class="p-3 text-right">
                        Basic Salary
                      </th>
                      <th class="p-3 text-right">
                        Net Pay (Est.)
                      </th>
                      <th class="p-3 text-right w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-default">
                    <tr v-if="employees.length === 0">
                      <td
                        colspan="8"
                        class="p-8 text-center text-muted"
                      >
                        No employees added yet.
                      </td>
                    </tr>
                    <tr
                      v-for="(emp, idx) in employees"
                      :key="emp.id"
                      class="hover:bg-elevated/50"
                    >
                      <td class="p-3 text-muted">
                        {{ idx + 1 }}
                      </td>
                      <td class="p-3 font-mono text-sm text-muted">
                        {{ emp.employeeId || '-' }}
                      </td>
                      <td class="p-3 font-medium">
                        {{ emp.name }}
                      </td>
                      <td class="p-3 text-muted text-sm">
                        {{ emp.function }}
                      </td>
                      <td class="p-3 text-xs">
                        <UBadge
                          :label="emp.employeeType === 'RESIDENT' ? 'Resident' : 'Non-Resident'"
                          size="xs"
                          variant="subtle"
                        />
                      </td>
                      <td class="p-3 text-right font-mono">
                        {{ formatCurrency(emp.basicSalary) }}
                      </td>
                      <td class="p-3 text-right font-mono font-bold text-success">
                        {{ formatCurrency(getNetPay(emp)) }}
                      </td>
                      <td class="p-3 text-right">
                        <div class="flex justify-end gap-1">
                          <UButton
                            icon="lucide:pencil"
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            @click="openEditEmployee(emp)"
                          />
                          <UButton
                            icon="lucide:trash-2"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click="handleDeleteEmployee(emp.id)"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </template>
        </section>
      </LayoutContent>

      <!-- Add/Edit Modal -->
      <UModal
        v-model:open="showAddEmployee"
        class="sm:max-w-3xl"
      >
        <template #content>
          <div class="p-6">
            <div>
              <h2 class="text-2xl font-semibold">
                {{ editingEmployee ? 'Edit Employee' : 'Add Employee' }}
              </h2>
              <p class="text-gray-500 mt-1">
                {{ editingEmployee ? 'Update employee details' : 'Add a new employee to the payroll' }}
              </p>
            </div>

            <div class="mt-8 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField label="Employee ID / TID">
                  <UInput
                    v-model="employeeForm.employeeId"
                    placeholder="ID Number"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Nationality">
                  <UInput
                    v-model="employeeForm.nationality"
                    placeholder="Nationality"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Name">
                  <UInput
                    v-model="employeeForm.name"
                    placeholder="Full Name"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Position">
                  <UInput
                    v-model="employeeForm.function"
                    placeholder="Job Title"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Employee Type"
                  class="md:col-span-2"
                >
                  <USelectMenu
                    v-model="employeeForm.employeeType"
                    :items="employeeTypeOptions"
                    value-attribute="value"
                    option-attribute="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Basic Salary">
                  <UInput
                    v-model.number="employeeForm.basicSalary"
                    type="number"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Pension Fund (USD)">
                  <UInput
                    v-model.number="employeeForm.pensionFund"
                    type="number"
                    placeholder="0"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Spouse">
                  <UInput
                    v-model.number="employeeForm.spouseCount"
                    type="number"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Children">
                  <UInput
                    v-model.number="employeeForm.minorChildrenCount"
                    type="number"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="flex justify-end pt-4 gap-4">
                <UButton
                  class="px-6 py-2 text-md border border-[#8DA1A5] bg-transparent hover:bg-accented text-[#8DA1A5] dark:text-[#ffffff]"
                  @click="showAddEmployee = false"
                >
                  Cancel
                </UButton>
                <UButton
                  class="px-6 py-2"
                  @click="handleSaveEmployee"
                >
                  {{ editingEmployee ? 'Update' : 'Add' }}
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
